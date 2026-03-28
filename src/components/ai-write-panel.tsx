'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  PenTool,
  Sparkles,
  Loader2,
  FileText,
  List,
  Expand,
  RefreshCw,
  Copy,
  Download,
  BookOpen,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Material {
  id: string
  title: string
  type: string
  summary?: string | null
  content?: string | null
}

interface AIWritePanelProps {
  materials: Material[]
  onOpenMaterial?: (id: string) => void
}

const writeTypes = [
  { value: 'article', label: '完整文章', icon: FileText, desc: '生成完整文章内容' },
  { value: 'outline', label: '文章大纲', icon: List, desc: '生成文章结构大纲' },
  { value: 'expansion', label: '内容扩展', icon: Expand, desc: '扩展深化已有内容' },
  { value: 'rewrite', label: '内容改写', icon: RefreshCw, desc: '优化改写现有内容' },
]

const styles = [
  { value: 'professional', label: '专业严谨' },
  { value: 'casual', label: '轻松口语' },
  { value: 'academic', label: '学术风格' },
  { value: 'storytelling', label: '故事化' },
]

export function AIWritePanel({ materials, onOpenMaterial }: AIWritePanelProps) {
  const [open, setOpen] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [writeType, setWriteType] = useState('article')
  const [style, setStyle] = useState('professional')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: writeType,
          materialIds: selectedMaterials,
          prompt,
          title,
          style
        })
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedContent(data.content)
        setDraftId(data.draftId)
      }
    } catch (error) {
      console.error('Generate error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
  }

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'AI生成内容'}-${new Date().toLocaleDateString('zh-CN')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const resetForm = () => {
    setSelectedMaterials([])
    setTitle('')
    setPrompt('')
    setGeneratedContent('')
    setDraftId(null)
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        title="AI写作助手"
      >
        <PenTool className="w-5 h-5" />
      </button>

      {/* 写作助手面板 */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-purple-500" />
              AI写作助手
              <Badge className="bg-purple-100 text-purple-700 text-[10px]">Beta</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4 mt-4">
            {/* 左侧：配置 */}
            <div className="w-1/3 space-y-4 overflow-y-auto pr-2">
              {/* 写作类型 */}
              <div>
                <Label className="text-xs text-gray-500">写作类型</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {writeTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setWriteType(type.value)}
                      className={cn(
                        "p-2 rounded-lg border text-left transition-all",
                        writeType === type.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <type.icon className="w-4 h-4 mb-1 text-purple-500" />
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 写作风格 */}
              <div>
                <Label className="text-xs text-gray-500">写作风格</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 标题 */}
              <div>
                <Label className="text-xs text-gray-500">文章标题（可选）</Label>
                <Input
                  placeholder="输入标题..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mt-1 h-8"
                />
              </div>

              {/* 额外要求 */}
              <div>
                <Label className="text-xs text-gray-500">额外要求（可选）</Label>
                <Textarea
                  placeholder="例如：侧重技术分析、加入案例等..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>

              {/* 选择素材 */}
              <div>
                <Label className="text-xs text-gray-500">参考素材（可选多个）</Label>
                <ScrollArea className="h-40 mt-1 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {materials.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">暂无素材可选</p>
                    ) : (
                      materials.map(m => (
                        <button
                          key={m.id}
                          onClick={() => toggleMaterial(m.id)}
                          className={cn(
                            "w-full text-left p-2 rounded text-xs transition-all",
                            selectedMaterials.includes(m.id)
                              ? "bg-purple-100 border-purple-300"
                              : "bg-gray-50 hover:bg-gray-100"
                          )}
                        >
                          <div className="font-medium truncate">{m.title}</div>
                          {m.summary && (
                            <div className="text-gray-400 truncate mt-0.5">{m.summary.slice(0, 40)}...</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {selectedMaterials.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
                    <BookOpen className="w-3 h-3" />
                    已选 {selectedMaterials.length} 个素材
                  </div>
                )}
              </div>

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    开始写作
                  </>
                )}
              </Button>
            </div>

            {/* 右侧：生成结果 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-gray-500">生成结果</Label>
                {generatedContent && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      复制
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="h-6 text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      下载
                    </Button>
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1 border rounded-lg bg-gray-50">
                {generatedContent ? (
                  <div className="p-4 prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{generatedContent}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <PenTool className="w-12 h-12 mb-2" />
                    <p className="text-sm">选择类型并点击"开始写作"</p>
                    <p className="text-xs mt-1">AI将根据素材和要求生成内容</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
