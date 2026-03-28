'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link2,
  FileText,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BatchImportProps {
  onImported?: () => void
}

export function BatchImport({ onImported }: BatchImportProps) {
  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [importType, setImportType] = useState<'text' | 'link'>('text')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: number
    failed: number
    duplicates: number
    message: string
  } | null>(null)

  const parseInput = () => {
    const lines = inputText.split('\n').filter(line => line.trim())
    
    if (importType === 'link') {
      // 解析链接：每行一个链接，可选标题（用空格或制表符分隔）
      return lines.map(line => {
        const parts = line.split(/[\t\s]{2,}/)
        const url = parts[0].trim()
        const title = parts[1]?.trim() || url
        return {
          type: 'LINK',
          title,
          sourceUrl: url
        }
      })
    } else {
      // 解析文本：每段是一个素材，空行分隔
      const items: Array<{ type: string; title: string; content: string }> = []
      let currentItem = ''
      let currentTitle = ''
      
      lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
          // 标题行
          if (currentItem || currentTitle) {
            items.push({
              type: 'TEXT',
              title: currentTitle || `素材 ${items.length + 1}`,
              content: currentItem.trim()
            })
          }
          currentTitle = line.slice(2).trim()
          currentItem = ''
        } else {
          currentItem += line + '\n'
        }
        
        // 最后一项
        if (index === lines.length - 1 && (currentItem || currentTitle)) {
          items.push({
            type: 'TEXT',
            title: currentTitle || `素材 ${items.length + 1}`,
            content: currentItem.trim()
          })
        }
      })
      
      return items
    }
  }

  const handleImport = async () => {
    const items = parseInput()
    
    if (items.length === 0) {
      setResult({
        success: 0,
        failed: 0,
        duplicates: 0,
        message: '没有可导入的内容'
      })
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/materials/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const data = await res.json()
      
      setResult({
        success: data.success || 0,
        failed: data.failed || 0,
        duplicates: data.duplicates || 0,
        message: data.message || '导入完成'
      })

      if (data.success > 0) {
        onImported?.()
      }
    } catch (error) {
      console.error('Import error:', error)
      setResult({
        success: 0,
        failed: items.length,
        duplicates: 0,
        message: '导入失败，请稍后重试'
      })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setInputText('')
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Upload className="w-4 h-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            批量导入素材
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 导入类型选择 */}
          <div>
            <Label className="text-sm text-gray-500">导入类型</Label>
            <Select value={importType} onValueChange={(v) => setImportType(v as 'text' | 'link')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    文本素材
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    链接素材
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 输入区域 */}
          <div>
            <Label className="text-sm text-gray-500">
              {importType === 'link' ? '链接列表（每行一个，可选标题）' : '文本内容'}
            </Label>
            <Textarea
              placeholder={
                importType === 'link' 
                  ? 'https://example.com 文章标题\nhttps://example2.com\n...'
                  : '# 标题1\n内容内容...\n\n# 标题2\n内容内容...'
              }
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={12}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* 格式说明 */}
          <Card className="p-3 bg-gray-50">
            <div className="text-xs text-gray-500 space-y-1">
              {importType === 'link' ? (
                <>
                  <p className="font-medium">链接格式说明：</p>
                  <p>• 每行一个链接</p>
                  <p>• 可用空格或制表符分隔链接和标题</p>
                  <p>• 示例：<code className="bg-gray-100 px-1 rounded">https://example.com 文章标题</code></p>
                </>
              ) : (
                <>
                  <p className="font-medium">文本格式说明：</p>
                  <p>• 使用 <code className="bg-gray-100 px-1 rounded"># 标题</code> 开始新素材</p>
                  <p>• 空行分隔不同素材</p>
                  <p>• 没有标题的内容将自动编号</p>
                </>
              )}
            </div>
          </Card>

          {/* 导入结果 */}
          {result && (
            <Card className="p-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  成功: {result.success}
                </div>
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  重复: {result.duplicates}
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  失败: {result.failed}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{result.message}</p>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !inputText.trim()}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                开始导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
