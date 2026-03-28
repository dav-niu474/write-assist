import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// 获取相关素材 - 智能关联
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 获取当前素材
    const currentMaterial = await db.material.findUnique({
      where: { id }
    })

    if (!currentMaterial) {
      return NextResponse.json({ success: false, error: '素材不存在' }, { status: 404 })
    }

    // 获取所有其他素材（排除当前素材）
    const otherMaterials = await db.material.findMany({
      where: { id: { not: id } },
      take: 30,
      orderBy: { createdAt: 'desc' }
    })

    if (otherMaterials.length === 0) {
      return NextResponse.json({ success: true, relatedMaterials: [] })
    }

    // 构建用于AI分析的文本
    const currentText = [
      currentMaterial.title,
      currentMaterial.content || '',
      currentMaterial.summary || '',
      currentMaterial.tags || '',
      currentMaterial.aiTags || ''
    ].filter(Boolean).join(' ')

    const zai = await ZAI.create()

    // 使用AI分析相关性
    const prompt = `分析以下素材与目标素材的相关性，返回最相关的5个素材ID和相关性分数。

目标素材：
${currentText.slice(0, 1000)}

候选素材：
${otherMaterials.map(m => {
  const text = [m.title, m.content?.slice(0, 200), m.summary?.slice(0, 100), m.tags]
    .filter(Boolean).join(' ')
  return `ID: ${m.id}\n标题: ${m.title}\n内容摘要: ${text.slice(0, 300)}`
}).join('\n\n')}

请分析主题相似度、关键词重叠、内容关联性等维度，返回JSON格式结果：
[{"id": "素材ID", "score": 0.9, "reason": "相关原因简述"}, ...]

只返回JSON数组，不要有其他内容：`

    const completion = await zai.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: '你是一个内容关联分析专家，擅长发现素材之间的关联关系。只返回JSON格式的分析结果。' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const responseText = completion.choices[0]?.message?.content || '[]'
    
    // 解析AI返回的相关性结果
    let relations: Array<{ id: string; score: number; reason: string }> = []
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        relations = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Parse relations error:', e)
    }

    // 获取相关素材的详细信息
    const relatedIds = relations.map(r => r.id).filter(id => 
      otherMaterials.some(m => m.id === id)
    )
    
    const relatedMaterials = await db.material.findMany({
      where: { id: { in: relatedIds } }
    })

    // 合并相关性信息
    const result = relatedMaterials.map(m => {
      const relation = relations.find(r => r.id === m.id)
      return {
        ...m,
        relevanceScore: relation?.score || 0.5,
        relevanceReason: relation?.reason || '内容相关'
      }
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      success: true,
      relatedMaterials: result.slice(0, 5)
    })
  } catch (error) {
    console.error('Get related materials error:', error)
    return NextResponse.json({ success: false, error: '获取相关素材失败' }, { status: 500 })
  }
}
