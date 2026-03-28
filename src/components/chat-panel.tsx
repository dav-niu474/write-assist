'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  FileText,
  Link2,
  Image as ImageIcon,
  Lightbulb,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  materials?: ReferencedMaterial[]
  timestamp: Date
}

interface ReferencedMaterial {
  id: string
  title: string
  type: string
  content?: string | null
  summary?: string | null
}

interface ChatPanelProps {
  onMaterialClick?: (id: string) => void
}

const typeColors: Record<string, string> = {
  TEXT: 'bg-emerald-100 text-emerald-700',
  LINK: 'bg-amber-100 text-amber-700',
  IMAGE: 'bg-purple-100 text-purple-700',
  INSPIRATION: 'bg-rose-100 text-rose-700'
}

const typeLabels: Record<string, string> = {
  TEXT: '文本',
  LINK: '链接',
  IMAGE: '图片',
  INSPIRATION: '灵感'
}

export function ChatPanel({ onMaterialClick }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是你的素材助手。你可以问我任何关于素材的问题，比如：\n\n• "我有哪些关于XX的素材？"\n• "帮我找找XX相关的内容"\n• "给我一些创作灵感"\n\n我会帮你从素材库中检索相关内容并给出建议。',
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, messages.length])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // 构建历史消息
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history
        })
      })

      const data = await res.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        materials: data.materials || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误，请稍后重试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* 浮动按钮 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          isOpen
            ? "bg-gray-500 hover:bg-gray-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </Button>

      {/* 聊天面板 */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-96 transition-all duration-300 origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <Card className="shadow-2xl border-gray-200 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white font-medium">素材助手</span>
          </div>

          {/* 消息区域 */}
          <ScrollArea ref={scrollRef} className="h-80 p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2",
                      message.role === 'user'
                        ? "bg-emerald-500 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                    )}
                  >
                    {/* 消息内容 */}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>

                    {/* 引用的素材 */}
                    {message.materials && message.materials.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          相关素材
                        </p>
                        {message.materials.map(material => (
                          <div
                            key={material.id}
                            onClick={() => onMaterialClick?.(material.id)}
                            className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {material.type === 'TEXT' && <FileText className="w-3 h-3 text-emerald-500" />}
                              {material.type === 'LINK' && <Link2 className="w-3 h-3 text-amber-500" />}
                              {material.type === 'IMAGE' && <ImageIcon className="w-3 h-3 text-purple-500" />}
                              {material.type === 'INSPIRATION' && <Lightbulb className="w-3 h-3 text-rose-500" />}
                              <span className="text-xs font-medium text-gray-700 line-clamp-1">
                                {material.title}
                              </span>
                              <Badge
                                className={cn("text-[10px] px-1 py-0", typeColors[material.type])}
                                variant="outline"
                              >
                                {typeLabels[material.type]}
                              </Badge>
                            </div>
                            {material.summary && (
                              <p className="text-[10px] text-gray-500 line-clamp-2">
                                {material.summary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 加载中 */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="flex-1 bg-gray-50 border-gray-200 focus:border-emerald-300"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-emerald-500 hover:bg-emerald-600 shrink-0"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
