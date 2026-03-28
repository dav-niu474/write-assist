'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CrawlerPanelProps {
  onSaved?: () => void
}

const platforms = [
  { value: 'xhs', label: '小红书', icon: '📕', color: '#ff2442' },
  { value: 'douyin', label: '抖音', icon: '🎵', color: '#000000' },
  { value: 'bilibili', label: 'B站', icon: '📺', color: '#00a1d6' },
  { value: 'weibo', label: '微博', icon: '📢', color: '#ff8200' },
]

interface CrawlerItem {
  note_id: string
  title: string
  desc: string
  nickname: string
  liked_count: number
  collected_count: number
  comment_count: number
  image_url: string
  video_url: string
  note_url: string
  create_time: string
}

export function CrawlerPanel({ onSaved }: CrawlerPanelProps) {
  const [platform, setPlatform] = useState('xhs')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [items, setItems] = useState<CrawlerItem[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [maxNotes, setMaxNotes] = useState('10')

  // 检查服务状态
  useEffect(() => {
    checkService()
  }, [])

  const checkService = async () => {
    setServiceStatus('checking')
    try {
      const res = await fetch('/api/crawler?path=status')
      const data = await res.json()
      setServiceStatus(data.success ? 'online' : 'offline')
    } catch (e) {
      setServiceStatus('offline')
    }
  }

  const handleSearch = async () => {
    if (!keyword.trim()) return
    
    setSearching(true)
    setItems([])
    
    try {
      const res = await fetch(`/api/crawler?path=data&platform=${platform}&keyword=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        setItems(data.data)
      } else {
        console.error('Search failed:', data.error)
      }
    } catch (e) {
      console.error('Search error:', e)
    } finally {
      setSearching(false)
    }
  }

  const handleCrawl = async () => {
    if (!keyword.trim()) return
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          keywords: keyword,
          maxNotes: parseInt(maxNotes) || 10
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // 等待几秒后搜索
        setTimeout(() => {
          handleSearch()
        }, 3000)
      }
    } catch (e) {
      console.error('Crawl error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (item: CrawlerItem) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LINK',
          title: item.title,
          content: item.desc,
          sourceUrl: item.note_url
        })
      })
      
      if (res.ok) {
        setSavedIds(prev => new Set([...prev, item.note_id]))
        onSaved?.()
      }
    } catch (e) {
      console.error('Save error:', e)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toString()
  }

  const currentPlatform = platforms.find(p => p.value === platform)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />
            内容抓取
          </h2>
          <div className="flex items-center gap-2">
            {serviceStatus === 'checking' && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                检测中
              </Badge>
            )}
            {serviceStatus === 'online' && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                服务在线
              </Badge>
            )}
            {serviceStatus === 'offline' && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                服务离线
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={checkService}
              className="h-8 w-8"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 平台选择 */}
        <div className="flex gap-2 mb-3">
          {platforms.map(p => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={cn(
                "flex-1 p-2 rounded-lg border text-sm transition-all",
                platform === p.value
                  ? "border-2 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              )}
              style={platform === p.value ? { borderColor: p.color } : {}}
            >
              <span className="mr-1">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="输入关键词搜索..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Input
            type="number"
            value={maxNotes}
            onChange={e => setMaxNotes(e.target.value)}
            placeholder="数量"
            className="w-20"
          />
          <Button 
            onClick={handleSearch}
            disabled={searching || !keyword.trim()}
            variant="outline"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button 
            onClick={handleCrawl}
            disabled={loading || !keyword.trim() || serviceStatus !== 'online'}
            style={{ backgroundColor: currentPlatform?.color }}
            className="text-white hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>

        {serviceStatus === 'offline' && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            MediaCrawler 服务未运行。请先启动服务：
            <code className="ml-1 bg-amber-100 px-1 rounded">cd MediaCrawler && python -m api.main</code>
          </div>
        )}
      </div>

      {/* 内容列表 */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Download className="w-12 h-12 mb-2" />
            <p className="text-sm">输入关键词搜索或抓取内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {items.map(item => (
              <Card
                key={item.note_id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open(item.note_url, '_blank')}
              >
                {/* 图片 */}
                {item.image_url && (
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item.nickname}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>❤️ {formatNumber(item.liked_count)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(item.note_url, '_blank')
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      查看
                    </Button>
                    <Button
                      variant={savedIds.has(item.note_id) ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!savedIds.has(item.note_id)) {
                          handleSave(item)
                        }
                      }}
                      disabled={savedIds.has(item.note_id)}
                    >
                      {savedIds.has(item.note_id) ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已收藏
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          收藏
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 底部提示 */}
      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center">
          内容来源于网络，仅供学习研究使用，请遵守目标平台规则
        </p>
      </div>
    </div>
  )
}
