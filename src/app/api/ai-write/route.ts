import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// AI 写作助手 - 基于素材生成文章
export async function POST(request: NextRequest) {
  try {
    const { 
      type = 'article', // article, outline, expansion, rewrite
      materialIds = [], 
      prompt = '',
      title = '',
      style = 'professional' // professional, casual, academic, storytelling
    } = await request.json()

    // 获取相关素材
    let materials: any[] = []
    if (materialIds.length > 0) {
      materials = await db.material.findMany({
        where: { id: { in: materialIds } }
      })
    }

    // 构建素材上下文
    const materialContext = materials.map(m => {
      let context = `【${m.title}】\n`
      if (m.summary) context += `摘要: ${m.summary}\n`
      if (m.content) context += `内容: ${m.content.slice(0, 500)}\n`
      if (m.inspirationHint) context += `灵感方向: ${m.inspirationHint}\n`
      return context
    }).join('\n---\n')

    const zai = await ZAI.create()

    // 根据类型选择不同的生成策略
    let systemPrompt = ''
    let userPrompt = ''

    const styleGuide: Record<string, string> = {
      professional: '专业、客观、有条理',
      casual: '轻松、口语化、接地气',
      academic: '学术、严谨、引用充分',
      storytelling: '故事化、引人入胜、情感丰富'
    }

    switch (type) {
      case 'outline':
        systemPrompt = `你是一位专业的内容策划师。根据提供的素材，生成一份详细的文章大纲。
要求：
1. 结构清晰，层次分明
2. 每个章节有明确的主题和要点
3. 风格: ${styleGuide[style]}
4. 直接输出大纲，使用Markdown格式`
        userPrompt = `素材内容：
${materialContext || '暂无参考素材'}

${prompt ? `额外要求：${prompt}` : ''}

请生成文章大纲：`
        break

      case 'expansion':
        systemPrompt = `你是一位专业的文案撰稿人。根据提供的素材和主题，对内容进行扩展和深化。
要求：
1. 保持原意，增加细节和案例
2. 逻辑连贯，过渡自然
3. 风格: ${styleGuide[style]}
4. 字数约800-1500字`
        userPrompt = `素材内容：
${materialContext || '暂无参考素材'}

主题：${title || '未指定主题'}
${prompt ? `额外要求：${prompt}` : ''}

请扩展内容：`
        break

      case 'rewrite':
        systemPrompt = `你是一位专业的内容编辑。对提供的素材进行改写和优化。
要求：
1. 保持核心信息不变
2. 优化表达，提升可读性
3. 风格: ${styleGuide[style]}
4. 避免直接复制原文`
        userPrompt = `素材内容：
${materialContext || '暂无参考素材'}

${prompt ? `改写要求：${prompt}` : ''}

请改写内容：`
        break

      default: // article
        systemPrompt = `你是一位专业的内容创作者。根据提供的素材，创作一篇完整的文章。
要求：
1. 标题吸引人，内容有价值
2. 结构完整，包含开头、主体、结尾
3. 风格: ${styleGuide[style]}
4. 字数约1000-2000字
5. 使用Markdown格式，适当使用小标题`
        userPrompt = `素材内容：
${materialContext || '暂无参考素材'}

${title ? `标题建议：${title}` : ''}
${prompt ? `额外要求：${prompt}` : ''}

请创作文章：`
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    // 保存草稿
    const draft = await db.draft.create({
      data: {
        title: title || `AI生成-${type}-${new Date().toLocaleDateString('zh-CN')}`,
        content: generatedContent,
        prompt,
        sourceIds: JSON.stringify(materialIds)
      }
    })

    return NextResponse.json({
      success: true,
      content: generatedContent,
      draftId: draft.id,
      usedMaterials: materials.length
    })
  } catch (error) {
    console.error('AI write error:', error)
    return NextResponse.json({ success: false, error: 'AI写作失败' }, { status: 500 })
  }
}
