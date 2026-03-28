import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// 简单的关键词提取（用于素材检索）
function extractKeywords(query: string): string[] {
  // 移除常见停用词
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '什么', '怎么', '为什么', '哪', '哪个', '哪些', '能', '可以',
    '吗', '呢', '吧', '啊', '嗯', '哦', '请', '帮', '帮我', '帮忙', '找', '查', '搜索',
    '一下', '有没有', '关于', '相关', '跟', '和', '与', '或者', '还是'
  ])

  // 分词（简单按空格和标点分割）
  const words = query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word))

  return [...new Set(words)]
}

// 在素材中搜索相关内容
async function searchRelevantMaterials(query: string, limit: number = 5) {
  const keywords = extractKeywords(query)

  // 获取所有未归档的素材
  const allMaterials = await db.material.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'desc' },
    take: 100 // 限制搜索范围
  })

  // 计算每个素材的相关性分数
  const scoredMaterials = allMaterials.map(material => {
    let score = 0
    const searchText = [
      material.title,
      material.content,
      material.summary,
      material.tags,
      material.aiTags,
      material.sourceUrl
    ].filter(Boolean).join(' ').toLowerCase()

    // 关键词匹配
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi')
      const matches = searchText.match(regex)
      if (matches) {
        score += matches.length * 2
      }
    }

    // 直接包含查询字符串
    if (searchText.includes(query.toLowerCase())) {
      score += 10
    }

    // 标题匹配加分
    if (material.title.toLowerCase().includes(query.toLowerCase())) {
      score += 5
    }

    return { material, score }
  })

  // 按分数排序并返回 top results
  return scoredMaterials
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.material)
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // 搜索相关素材
    const relevantMaterials = await searchRelevantMaterials(message)

    // 构建上下文
    let contextText = ''
    if (relevantMaterials.length > 0) {
      contextText = '\n\n以下是用户素材库中相关的内容，可以作为回答参考：\n'
      relevantMaterials.forEach((m, i) => {
        contextText += `\n【素材${i + 1}】\n`
        contextText += `标题：${m.title}\n`
        if (m.content) contextText += `内容：${m.content.slice(0, 500)}${m.content.length > 500 ? '...' : ''}\n`
        if (m.summary) contextText += `摘要：${m.summary}\n`
        if (m.sourceUrl) contextText += `来源：${m.sourceUrl}\n`
        contextText += `类型：${m.type}\n`
      })
    }

    // 构建对话消息
    const systemPrompt = `你是一个智能素材助手，帮助用户管理和查找他们的素材内容。

你的职责：
1. 帮助用户检索和发现素材库中的相关内容
2. 基于用户的素材提供创作建议和灵感
3. 解答关于素材内容的问题
4. 帮助用户整理和归类素材

回答要求：
- 回答要简洁、有用、友好
- 如果找到了相关素材，在回答中引用它们（如"根据你的素材..."）
- 如果没有找到相关素材，可以建议用户添加相关内容
- 可以基于素材内容给出创作建议或灵感方向
- 回答控制在200字以内

${contextText}`

    // 调用 AI
    const zai = await ZAI.create()
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: message }
    ]

    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 500
    })

    const reply = completion.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。'

    return NextResponse.json({
      reply,
      materials: relevantMaterials.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        content: m.content?.slice(0, 200),
        summary: m.summary
      }))
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: '对话处理失败，请稍后重试' },
      { status: 500 }
    )
  }
}
