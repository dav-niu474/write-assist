import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/materials/[id]/ai-tags - Generate AI tags
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get material
    const material = await db.material.findUnique({
      where: { id }
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Prepare content for tags
    const content = material.content || material.title || ''
    if (!content) {
      return NextResponse.json({ error: 'No content to generate tags' }, { status: 400 })
    }

    // Generate tags using AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个内容标签助手。请为以下内容生成5-8个相关标签，标签应该简洁、准确。请直接输出标签，用逗号分隔，不要添加任何前缀或解释。例如：科技,人工智能,创新,发展趋势'
        },
        {
          role: 'user',
          content
        }
      ]
    })

    const tagsText = completion.choices[0]?.message?.content || ''
    const tags = tagsText.split(/[,，、]/).map(t => t.trim()).filter(t => t.length > 0 && t.length <= 10)

    // Update material
    const updated = await db.material.update({
      where: { id },
      data: { aiTags: JSON.stringify(tags) }
    })

    return NextResponse.json({ material: updated })
  } catch (error) {
    console.error('Error generating tags:', error)
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    )
  }
}
