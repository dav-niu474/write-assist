import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取所有标签
export async function GET() {
  try {
    // 从素材中提取所有标签
    const materials = await db.material.findMany({
      where: { 
        OR: [
          { tags: { not: null } },
          { aiTags: { not: null } }
        ]
      },
      select: { tags: true, aiTags: true }
    })

    const tagMap = new Map<string, { count: number; isAi: boolean }>()

    materials.forEach(m => {
      // 用户标签
      if (m.tags) {
        try {
          const tags = JSON.parse(m.tags)
          tags.forEach((tag: string) => {
            const existing = tagMap.get(tag) || { count: 0, isAi: false }
            tagMap.set(tag, { count: existing.count + 1, isAi: false })
          })
        } catch (e) {
          // ignore
        }
      }
      // AI 标签
      if (m.aiTags) {
        try {
          const tags = JSON.parse(m.aiTags)
          tags.forEach((tag: string) => {
            const existing = tagMap.get(tag) || { count: 0, isAi: true }
            tagMap.set(tag, { count: existing.count + 1, isAi: true })
          })
        } catch (e) {
          // ignore
        }
      }
    })

    // 转换为数组并排序
    const tags = Array.from(tagMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        isAi: data.isAi
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      tags,
      total: tags.length
    })
  } catch (error) {
    console.error('Get tags error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取标签失败' 
    }, { status: 500 })
  }
}

// 创建自定义标签
export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: '标签名称不能为空' 
      }, { status: 400 })
    }

    // 检查是否已存在
    const existing = await db.tag.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        tag: existing,
        message: '标签已存在'
      })
    }

    // 创建新标签
    const tag = await db.tag.create({
      data: {
        name: name.trim(),
        color: color || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      tag 
    })
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '创建标签失败' 
    }, { status: 500 })
  }
}

// 删除标签
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供标签名称' 
      }, { status: 400 })
    }

    // 从数据库删除
    await db.tag.delete({
      where: { name }
    }).catch(() => {
      // 如果标签不在 tag 表中，忽略错误
    })

    // 从所有素材中移除该标签
    const materials = await db.material.findMany({
      where: { tags: { contains: name } },
      select: { id: true, tags: true }
    })

    for (const m of materials) {
      if (m.tags) {
        try {
          const tags = JSON.parse(m.tags).filter((t: string) => t !== name)
          await db.material.update({
            where: { id: m.id },
            data: { tags: tags.length > 0 ? JSON.stringify(tags) : null }
          })
        } catch (e) {
          // ignore
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '标签已删除'
    })
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '删除标签失败' 
    }, { status: 500 })
  }
}
