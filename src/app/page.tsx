'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Link2,
  Image as ImageIcon,
  Lightbulb,
  Star,
  StarOff,
  Trash2,
  Search,
  Plus,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Loader2,
  Copy,
  Tag,
  TrendingUp,
  Compass,
  FolderPlus,
  Download,
  Folder,
  PenTool,
  Link as LinkIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatPanel } from '@/components/chat-panel'
import { DiscoverPanel } from '@/components/discover-panel'
import { AIWritePanel } from '@/components/ai-write-panel'

// Types
type MaterialType = 'TEXT' | 'LINK' | 'IMAGE' | 'INSPIRATION'

interface Material {
  id: string
  type: MaterialType
  title: string
  content: string | null
  sourceUrl: string | null
  images: string | null
  ocrText: string | null
  tags: string | null
  summary: string | null
  aiTags: string | null
  inspirationHint: string | null
  isFavorite: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

// Type badge colors
const typeColors: Record<MaterialType, string> = {
  TEXT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LINK: 'bg-amber-100 text-amber-700 border-amber-200',
  IMAGE: 'bg-purple-100 text-purple-700 border-purple-200',
  INSPIRATION: 'bg-rose-100 text-rose-700 border-rose-200'
}

const typeLabels: Record<MaterialType, string> = {
  TEXT: '文本',
  LINK: '链接',
  IMAGE: '图片',
  INSPIRATION: '灵感'
}

export default function Home() {
  // State
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDiscover, setShowDiscover] = useState(false)

  // Form states
  const [textForm, setTextForm] = useState({ title: '', content: '' })
  const [inspirationForm, setInspirationForm] = useState({ content: '' })
  const [linkForm, setLinkForm] = useState({ url: '', title: '' })
  const [linkParsing, setLinkParsing] = useState(false)
  const [imageForm, setImageForm] = useState({ title: '', file: null as File | null })
  const [imageUploading, setImageUploading] = useState(false)

  // AI states
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  // 打开指定素材详情（从聊天面板跳转）
  const openMaterialById = async (id: string) => {
    try {
      const res = await fetch(`/api/materials/${id}`)
      const data = await res.json()
      if (data.material) {
        setSelectedMaterial(data.material)
        setDetailDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to open material:', error)
    }
  }

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedType) params.append('type', selectedType)
      if (showFavorites) params.append('favorite', 'true')
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await fetch(`/api/materials?${params.toString()}`)
      const data = await res.json()
      setMaterials(data.materials || [])
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    } finally {
      setLoading(false)
    }
  }, [search, selectedType, showFavorites, sortBy, sortOrder])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  // Create material
  const createMaterial = async (data: {
    type: MaterialType
    title: string
    content?: string
    sourceUrl?: string
    images?: string[]
    tags?: string[]
  }) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        fetchMaterials()
        setAddDialogOpen(false)
        // Reset forms
        setTextForm({ title: '', content: '' })
        setInspirationForm({ content: '' })
        setLinkForm({ url: '', title: '' })
        setImageForm({ title: '', file: null })
      }
    } catch (error) {
      console.error('Failed to create material:', error)
    }
  }

  // Upload image
  const uploadImage = async () => {
    if (!imageForm.file) return
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageForm.file)
      formData.append('title', imageForm.title || '未命名图片')

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        fetchMaterials()
        setAddDialogOpen(false)
        setImageForm({ title: '', file: null })
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setImageUploading(false)
    }
  }

  // Toggle favorite
  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !current })
      })
      fetchMaterials()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  // Delete material
  const deleteMaterial = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return
    try {
      await fetch(`/api/materials/${id}`, { method: 'DELETE' })
      fetchMaterials()
      if (selectedMaterial?.id === id) {
        setDetailDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to delete material:', error)
    }
  }

  // Parse link
  const parseLink = async () => {
    if (!linkForm.url) return
    setLinkParsing(true)
    try {
      const res = await fetch('/api/materials/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkForm.url })
      })
      const data = await res.json()
      if (data.title) {
        setLinkForm(prev => ({ ...prev, title: data.title }))
      }
    } catch (error) {
      console.error('Failed to parse link:', error)
    } finally {
      setLinkParsing(false)
    }
  }

  // AI Summary
  const generateSummary = async (id: string) => {
    setAiLoading(`summary-${id}`)
    try {
      await fetch(`/api/materials/${id}/ai-summary`, { method: 'POST' })
      fetchMaterials()
      // Update selected material
      if (selectedMaterial?.id === id) {
        const res = await fetch(`/api/materials/${id}`)
        const data = await res.json()
        setSelectedMaterial(data.material)
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setAiLoading(null)
    }
  }

  // AI Tags
  const generateTags = async (id: string) => {
    setAiLoading(`tags-${id}`)
    try {
      await fetch(`/api/materials/${id}/ai-tags`, { method: 'POST' })
      fetchMaterials()
      if (selectedMaterial?.id === id) {
        const res = await fetch(`/api/materials/${id}`)
        const data = await res.json()
        setSelectedMaterial(data.material)
      }
    } catch (error) {
      console.error('Failed to generate tags:', error)
    } finally {
      setAiLoading(null)
    }
  }

  // AI Inspiration
  const generateInspiration = async (id: string) => {
    setAiLoading(`inspiration-${id}`)
    try {
      await fetch(`/api/materials/${id}/inspiration`, { method: 'POST' })
      fetchMaterials()
      if (selectedMaterial?.id === id) {
        const res = await fetch(`/api/materials/${id}`)
        const data = await res.json()
        setSelectedMaterial(data.material)
      }
    } catch (error) {
      console.error('Failed to generate inspiration:', error)
    } finally {
      setAiLoading(null)
    }
  }

  // Get content preview
  const getContentPreview = (material: Material) => {
    if (material.content) {
      return material.content.length > 100 ? material.content.slice(0, 100) + '...' : material.content
    }
    if (material.summary) {
      return material.summary.length > 100 ? material.summary.slice(0, 100) + '...' : material.summary
    }
    if (material.sourceUrl) {
      return material.sourceUrl
    }
    return '暂无内容预览'
  }

  // Get image URL from material
  const getImageUrl = (material: Material): string | null => {
    if (material.images) {
      try {
        const images = JSON.parse(material.images)
        return images[0] || null
      } catch {
        return null
      }
    }
    return null
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Count by type
  const typeCounts = materials.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1
    return acc
  }, {} as Record<MaterialType, number>)

  const favoriteCount = materials.filter(m => m.isFavorite).length

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800">素材灵感库</span>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {/* Discover */}
            <button
              onClick={() => {
                setShowDiscover(true)
                setSelectedType('')
                setShowFavorites(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                showDiscover
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="flex-1">发现热门</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </button>

            {/* All Materials */}
            <button
              onClick={() => {
                setSelectedType('')
                setShowFavorites(false)
                setShowDiscover(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                !selectedType && !showFavorites && !showDiscover
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <FileText className="w-5 h-5" />
              <span className="flex-1">全部素材</span>
              <Badge variant="secondary" className="text-xs">{materials.length}</Badge>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                setShowFavorites(true)
                setSelectedType('')
                setShowDiscover(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                showFavorites
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Star className="w-5 h-5" />
              <span className="flex-1">收藏</span>
              <Badge variant="secondary" className="text-xs">{favoriteCount}</Badge>
            </button>
          </div>

          <Separator className="my-4" />

          {/* By Type */}
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">按类型</p>
            
            {(['TEXT', 'LINK', 'IMAGE', 'INSPIRATION'] as MaterialType[]).map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setShowFavorites(false)
                  setShowDiscover(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  selectedType === type
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {type === 'TEXT' && <FileText className="w-5 h-5" />}
                {type === 'LINK' && <Link2 className="w-5 h-5" />}
                {type === 'IMAGE' && <ImageIcon className="w-5 h-5" />}
                {type === 'INSPIRATION' && <Lightbulb className="w-5 h-5" />}
                <span className="flex-1">{typeLabels[type]}</span>
                <Badge variant="secondary" className="text-xs">{typeCounts[type] || 0}</Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索素材..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'createdAt' | 'updatedAt')}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="createdAt">创建时间</option>
              <option value="updatedAt">更新时间</option>
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="text-gray-500"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>

          {/* Add Button */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                添加素材
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>添加新素材</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="text" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="text" className="text-xs">文本</TabsTrigger>
                  <TabsTrigger value="link" className="text-xs">链接</TabsTrigger>
                  <TabsTrigger value="image" className="text-xs">图片</TabsTrigger>
                  <TabsTrigger value="inspiration" className="text-xs">灵感</TabsTrigger>
                </TabsList>

                {/* Text Form */}
                <TabsContent value="text" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="text-title">标题</Label>
                    <Input
                      id="text-title"
                      placeholder="输入标题..."
                      value={textForm.title}
                      onChange={e => setTextForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="text-content">内容</Label>
                    <Textarea
                      id="text-content"
                      placeholder="粘贴或输入文本内容..."
                      value={textForm.content}
                      onChange={e => setTextForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => createMaterial({
                      type: 'TEXT',
                      title: textForm.title || '未命名文本',
                      content: textForm.content
                    })}
                    disabled={!textForm.title && !textForm.content}
                  >
                    保存文本
                  </Button>
                </TabsContent>

                {/* Link Form */}
                <TabsContent value="link" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="link-url">链接地址</Label>
                    <div className="flex gap-2">
                      <Input
                        id="link-url"
                        placeholder="https://..."
                        value={linkForm.url}
                        onChange={e => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                      />
                      <Button
                        variant="outline"
                        onClick={parseLink}
                        disabled={!linkForm.url || linkParsing}
                      >
                        {linkParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : '解析'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="link-title">标题</Label>
                    <Input
                      id="link-title"
                      placeholder="链接标题"
                      value={linkForm.title}
                      onChange={e => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => createMaterial({
                      type: 'LINK',
                      title: linkForm.title || linkForm.url,
                      sourceUrl: linkForm.url
                    })}
                    disabled={!linkForm.url}
                  >
                    保存链接
                  </Button>
                </TabsContent>

                {/* Image Form */}
                <TabsContent value="image" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="image-title">标题</Label>
                    <Input
                      id="image-title"
                      placeholder="输入图片标题..."
                      value={imageForm.title}
                      onChange={e => setImageForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-file">选择图片</Label>
                    <div className="mt-2">
                      <label
                        htmlFor="image-file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {imageForm.file ? (
                          <div className="flex flex-col items-center p-2">
                            <img
                              src={URL.createObjectURL(imageForm.file)}
                              alt="Preview"
                              className="max-h-20 object-contain rounded"
                            />
                            <p className="text-xs text-gray-500 mt-1">{imageForm.file.name}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">点击选择图片</p>
                            <p className="text-xs text-gray-400">支持 JPG, PNG, GIF, WebP</p>
                          </div>
                        )}
                        <input
                          id="image-file"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setImageForm(prev => ({ ...prev, file }))
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={uploadImage}
                    disabled={!imageForm.file || imageUploading}
                  >
                    {imageUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        上传中...
                      </>
                    ) : (
                      '上传图片'
                    )}
                  </Button>
                </TabsContent>

                {/* Inspiration Form */}
                <TabsContent value="inspiration" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="inspiration-content">灵感速记</Label>
                    <Input
                      id="inspiration-content"
                      placeholder="快速记录你的灵感..."
                      value={inspirationForm.content}
                      onChange={e => setInspirationForm(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => createMaterial({
                      type: 'INSPIRATION',
                      title: inspirationForm.content.slice(0, 30) || '灵感速记',
                      content: inspirationForm.content
                    })}
                    disabled={!inspirationForm.content}
                  >
                    保存灵感
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </header>

        {/* Content */}
        {showDiscover ? (
          <DiscoverPanel onSaved={() => {
            fetchMaterials()
            setShowDiscover(false)
          }} />
        ) : (
        <ScrollArea className="flex-1 p-6">
          {/* Active Filters */}
          {(selectedType || showFavorites) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">筛选:</span>
              {showFavorites && (
                <Badge variant="secondary" className="gap-1">
                  收藏
                  <button onClick={() => setShowFavorites(false)} className="ml-1 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1">
                  {typeLabels[selectedType as MaterialType]}
                  <button onClick={() => setSelectedType('')} className="ml-1 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Materials Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg">暂无素材</p>
              <p className="text-sm">点击"添加素材"开始收集你的灵感</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(material => (
                <Card
                  key={material.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                  onClick={() => {
                    setSelectedMaterial(material)
                    setDetailDialogOpen(true)
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-medium line-clamp-2">
                        {material.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(material.id, material.isFavorite)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {material.isFavorite ? (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMaterial(material.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Image Preview */}
                    {material.type === 'IMAGE' && getImageUrl(material) && (
                      <div className="mb-3">
                        <img
                          src={getImageUrl(material)!}
                          alt={material.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                      {getContentPreview(material)}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={cn("text-xs", typeColors[material.type])} variant="outline">
                        {typeLabels[material.type]}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(material.createdAt)}
                      </span>
                    </div>
                    {material.summary && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          已生成摘要
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMaterial && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={cn(typeColors[selectedMaterial.type])} variant="outline">
                    {typeLabels[selectedMaterial.type]}
                  </Badge>
                  {selectedMaterial.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Image Display */}
                {selectedMaterial.type === 'IMAGE' && getImageUrl(selectedMaterial) && (
                  <div>
                    <Label className="text-sm text-gray-500">图片</Label>
                    <div className="mt-1">
                      <img
                        src={getImageUrl(selectedMaterial)!}
                        alt={selectedMaterial.title}
                        className="w-full max-h-64 object-contain rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div>
                  <Label className="text-sm text-gray-500">内容</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedMaterial.content || '暂无内容'}
                  </div>
                </div>

                {/* Source URL */}
                {selectedMaterial.sourceUrl && (
                  <div>
                    <Label className="text-sm text-gray-500">来源链接</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <a
                        href={selectedMaterial.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        {selectedMaterial.sourceUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* OCR Text */}
                {selectedMaterial.ocrText && (
                  <div>
                    <Label className="text-sm text-gray-500">OCR识别文字</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedMaterial.ocrText}
                    </div>
                  </div>
                )}

                <Separator />

                {/* AI Features */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">AI 功能</span>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-500">AI 摘要</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSummary(selectedMaterial.id)}
                        disabled={aiLoading === `summary-${selectedMaterial.id}`}
                      >
                        {aiLoading === `summary-${selectedMaterial.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        生成摘要
                      </Button>
                    </div>
                    {selectedMaterial.summary ? (
                      <div className="p-3 bg-emerald-50 rounded-lg text-sm">
                        {selectedMaterial.summary}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
                        点击"生成摘要"AI将为你总结内容
                      </div>
                    )}
                  </div>

                  {/* AI Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-500">AI 标签建议</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateTags(selectedMaterial.id)}
                        disabled={aiLoading === `tags-${selectedMaterial.id}`}
                      >
                        {aiLoading === `tags-${selectedMaterial.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Tag className="w-3 h-3 mr-1" />
                        )}
                        生成标签
                      </Button>
                    </div>
                    {selectedMaterial.aiTags ? (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(selectedMaterial.aiTags).map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
                        点击"生成标签"AI将为你推荐标签
                      </div>
                    )}
                  </div>

                  {/* Inspiration Hint */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-500">AI 灵感方向</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInspiration(selectedMaterial.id)}
                        disabled={aiLoading === `inspiration-${selectedMaterial.id}`}
                      >
                        {aiLoading === `inspiration-${selectedMaterial.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Lightbulb className="w-3 h-3 mr-1" />
                        )}
                        生成灵感
                      </Button>
                    </div>
                    {selectedMaterial.inspirationHint ? (
                      <div className="p-3 bg-rose-50 rounded-lg text-sm">
                        {selectedMaterial.inspirationHint}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
                        点击"生成灵感"AI将为你提供创作方向
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>创建于 {formatDate(selectedMaterial.createdAt)}</span>
                  <span>更新于 {formatDate(selectedMaterial.updatedAt)}</span>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMaterial.content || '')
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制内容
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedMaterial.id, selectedMaterial.isFavorite)}
                >
                  {selectedMaterial.isFavorite ? (
                    <>
                      <StarOff className="w-4 h-4 mr-2" />
                      取消收藏
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      收藏
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMaterial(selectedMaterial.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat Panel */}
      <ChatPanel onMaterialClick={openMaterialById} />
      
      {/* AI Write Panel */}
      <AIWritePanel materials={materials} onOpenMaterial={openMaterialById} />
    </div>
  )
}
