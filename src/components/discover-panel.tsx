'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Search,
  TrendingUp,
  Bookmark,
  ExternalLink,
  Loader2,
  Flame,
  RefreshCw,
  CheckCircle,
  Zap,
  Clock,
  Plus,
  Bot,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendItem {
  id: string
  platform: string
  platformName: string
  platformIcon: string
  platformColor: string
  title: string
  summary: string
  url: string
  source: string
  type: 'realtime' | 'fallback' | 'search'
  hotRank: number
  heat: number
  trend: 'hot' | 'rising' | 'normal'
  createdAt: string
}

interface PlatformInfo {
  value: string
  label: string
  icon: string
  color: string
  isAI?: boolean
}

interface DiscoverPanelProps {
  onSaved?: () => void
}

export function DiscoverPanel({ onSaved }: DiscoverPanelProps) {
  const [activePlatform, setActivePlatform] = useState('ai')
  const [platforms] = useState<PlatformInfo[]>([
    { value: 'ai', label: 'AI热榜', icon: '🤖', color: '#8b5cf6', isAI: true },
    { value: 'wb', label: '微博', icon: '📢', color: '#ff8200' },
    { value: 'zhihu', label: '知乎', icon: '💡', color: '#0066ff' },
    { value: 'dy', label: '抖音', icon: '🎵', color: '#000000' },
    { value: 'bili', label: 'B站', icon: '📺', color: '#00a1d6' },
    { value: 'xhs', label: '小红书', icon: '📕', color: '#ff2442' },
    { value: 'toutiao', label: '今日头条', icon: '📰', color: '#f85959' },
    { value: 'baidu', label: '百度热搜', icon: '🔍', color: '#2932e1' }
  ])
  const [items, setItems] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  
  // 保存弹窗状态
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TrendItem | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)

  // 加载热门内容
  useEffect(() => {
    fetchTrendingContent(activePlatform)
  }, [activePlatform])

  const fetchTrendingContent = useCallback(async (platform: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/discover?platform=${platform}`)
      const data = await res.json()
      setItems(data.items || [])
      setLastUpdate(data.lastUpdate || new Date().toISOString())
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchKeyword })
      })
      const data = await res.json()
      setItems(data.items || [])
      setLastUpdate(data.lastUpdate || new Date().toISOString())
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openSaveDialog = (item: TrendItem) => {
    setSelectedItem(item)
    setCustomTitle(item.title)
    setCustomNote('')
    setSaveDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedItem) return
    setSavingCustom(true)
    try {
      const res = await fetch('/api/discover/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle || selectedItem.title,
          content: customNote || selectedItem.summary,
          sourceUrl: selectedItem.url,
          platform: selectedItem.platform,
          platformName: selectedItem.platformName,
          summary: selectedItem.summary
        })
      })
      const data = await res.json()
      if (data.success) {
        setSavedIds(prev => new Set([...prev, selectedItem.id]))
        setSaveDialogOpen(false)
        onSaved?.()
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSavingCustom(false)
    }
  }

  const formatHeat = (heat: number) => {
    if (heat >= 100000000) return `${(heat / 100000000).toFixed(1)}亿`
    if (heat >= 10000) return `${(heat / 10000).toFixed(0)}万`
    return heat.toString()
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'hot':
        return (
          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
            <Flame className="w-2.5 h-2.5 mr-0.5" />
            爆
          </Badge>
        )
      case 'rising':
        return (
          <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            热
          </Badge>
        )
      default:
        return null
    }
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md'
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow'
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow'
    return 'bg-gray-100 text-gray-600'
  }

  const isAIPlatform = activePlatform === 'ai'
  
  // 计算数据新鲜度
  const getDataFreshness = () => {
    if (!lastUpdate) return null
    const now = new Date()
    const updateTime = new Date(lastUpdate)
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / 60000)
    if (diffMinutes < 1) return '刚刚更新'
    if (diffMinutes < 5) return `${diffMinutes}分钟前`
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    return updateTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {isAIPlatform ? (
                <>
                  <Bot className="w-5 h-5 text-violet-500" />
                  AI热榜
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                    实时
                  </Badge>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  实时热搜
                </>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isAIPlatform && (
                <p className="text-xs text-violet-500">AI领域最新动态与热点</p>
              )}
              {lastUpdate && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getDataFreshness()}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrendingContent(activePlatform)}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loading && "animate-spin")} />
            刷新
          </Button>
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={isAIPlatform ? "搜索AI相关话题..." : "搜索热点话题..."}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading} 
            size="sm"
            className={cn("h-9", isAIPlatform ? "bg-violet-600 hover:bg-violet-700" : "bg-gray-900 hover:bg-gray-800")}
          >
            搜索
          </Button>
        </div>

        {/* 平台选择 */}
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            {platforms.map(platform => (
              <button
                key={platform.value}
                onClick={() => setActivePlatform(platform.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  activePlatform === platform.value
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  platform.isAI && activePlatform !== platform.value && "bg-violet-50 text-violet-600 hover:bg-violet-100"
                )}
                style={activePlatform === platform.value ? { backgroundColor: platform.color } : {}}
              >
                {platform.icon} {platform.label}
                {platform.isAI && activePlatform !== platform.value && (
                  <Sparkles className="w-3 h-3 inline ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 内容列表 */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className={cn("w-8 h-8 animate-spin mb-2", isAIPlatform ? "text-violet-500" : "text-gray-400")} />
            <p className="text-sm text-gray-500">
              {isAIPlatform ? "正在获取AI热点..." : "正在获取实时热搜..."}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Flame className="w-10 h-10 mb-2" />
            <p className="text-sm">暂无热点内容</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                  savedIds.has(item.id) && "bg-green-50/50",
                  isAIPlatform && item.hotRank <= 3 && "bg-violet-50/30"
                )}
                onClick={() => window.open(item.url, '_blank')}
              >
                {/* 排名 */}
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                  getRankStyle(item.hotRank),
                  isAIPlatform && item.hotRank === 1 && "bg-gradient-to-br from-violet-400 to-purple-600"
                )}>
                  {item.hotRank}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs">{item.platformIcon}</span>
                    {getTrendBadge(item.trend)}
                    {item.type === 'realtime' && (
                      <Badge className="bg-green-100 text-green-600 text-[9px] px-1 py-0 h-3.5">
                        实时
                      </Badge>
                    )}
                    {isAIPlatform && item.source && item.source !== 'AI领域' && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[60px]">{item.source}</span>
                    )}
                  </div>
                  <h3 className="text-sm text-gray-900 line-clamp-1 font-medium">
                    {item.title}
                  </h3>
                  {isAIPlatform && item.summary && item.summary !== `${item.title} - AI领域热门话题` && (
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{item.summary.slice(0, 40)}...</p>
                  )}
                </div>

                {/* 热度 */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    "text-xs font-semibold",
                    isAIPlatform ? "text-violet-500" : "text-red-500"
                  )}>
                    {formatHeat(item.heat)}
                  </div>
                  <div className="text-[10px] text-gray-400">热度</div>
                </div>

                {/* 操作按钮 */}
                <Button
                  variant={savedIds.has(item.id) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!savedIds.has(item.id)) {
                      openSaveDialog(item)
                    }
                  }}
                  disabled={savedIds.has(item.id)}
                  className="h-7 w-7 p-0 shrink-0"
                >
                  {savedIds.has(item.id) ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 保存弹窗 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-500" />
              收藏到素材库
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-gray-500">标题</Label>
              <Input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="输入标题"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-500">备注（可选）</Label>
              <Textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="添加你的想法或备注..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            {selectedItem && (
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-500">
                <p><strong>来源：</strong>{selectedItem.platformIcon} {selectedItem.platformName}</p>
                <p><strong>热度：</strong>{formatHeat(selectedItem.heat)}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={savingCustom || !customTitle.trim()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {savingCustom ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Bookmark className="w-4 h-4 mr-1" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 底部 */}
      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center">
          {isAIPlatform 
            ? "AI热榜 - 聚合AI领域最新动态与热点话题" 
            : "数据来源于网络公开信息，仅供学习参考"}
        </p>
      </div>
    </div>
  )
}
