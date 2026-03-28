import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/materials - List all materials with search/filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const favorite = searchParams.get('favorite')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: Record<string, unknown> = {
      isArchived: false
    }

    if (type && ['TEXT', 'LINK', 'IMAGE', 'INSPIRATION'].includes(type)) {
      where.type = type
    }

    if (favorite === 'true') {
      where.isFavorite = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }

    // Build orderBy
    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const materials = await db.material.findMany({
      where,
      orderBy,
      take: 100
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST /api/materials - Create new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, content, sourceUrl, images, tags } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      )
    }

    const material = await db.material.create({
      data: {
        type,
        title,
        content: content || null,
        sourceUrl: sourceUrl || null,
        images: images ? JSON.stringify(images) : null,
        tags: tags ? JSON.stringify(tags) : null
      }
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}
