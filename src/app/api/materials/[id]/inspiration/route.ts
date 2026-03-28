import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/materials/[id]/inspiration - Generate AI inspiration hint
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

    // Prepare content
    const content = material.content || material.title || ''
    if (!content) {
      return NextResponse.json({ error: 'No content to generate inspiration' }, { status: 400 })
    }

    // Generate inspiration hint using AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个内容创作灵感助手。请根据以下素材，为创作者提供3-4个内容创作方向或灵感提示。要求：1. 简洁明了，每个方向用一句话描述；2. 提供具体的创作角度或视角；3. 注重实用性和可操作性。请直接输出内容，使用数字列表格式。'
        },
        {
          role: 'user',
          content: `素材内容：${content}`
        }
      ]
    })

    const inspirationHint = completion.choices[0]?.message?.content || ''

    // Update material
    const updated = await db.material.update({
      where: { id },
      data: { inspirationHint }
    })

    return NextResponse.json({ material: updated })
  } catch (error) {
    console.error('Error generating inspiration:', error)
    return NextResponse.json(
      { error: 'Failed to generate inspiration' },
      { status: 500 }
    )
  }
}
