import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/materials/[id]/ai-summary - Generate AI summary
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

    // Prepare content for summary
    const content = material.content || material.title || ''
    if (!content) {
      return NextResponse.json({ error: 'No content to summarize' }, { status: 400 })
    }

    // Generate summary using AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个内容摘要助手。请为以下内容生成简洁的中文摘要（不超过100字），直接输出摘要内容，不要添加任何前缀或解释。'
        },
        {
          role: 'user',
          content
        }
      ]
    })

    const summary = completion.choices[0]?.message?.content || ''

    // Update material
    const updated = await db.material.update({
      where: { id },
      data: { summary }
    })

    return NextResponse.json({ material: updated })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
