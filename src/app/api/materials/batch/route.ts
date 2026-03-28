import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 批量导入素材
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供要导入的素材列表' 
      }, { status: 400 })
    }

    // 限制单次导入数量
    if (items.length > 100) {
      return NextResponse.json({ 
        success: false, 
        error: '单次最多导入100条素材' 
      }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      duplicates: 0
    }

    for (const item of items) {
      try {
        const { type, title, content, sourceUrl, tags } = item

        if (!type || !title) {
          results.failed++
          continue
        }

        // 检查重复（根据标题）
        const existing = await db.material.findFirst({
          where: {
            title: title.trim()
          }
        })

        if (existing) {
          results.duplicates++
          continue
        }

        // 创建素材
        await db.material.create({
          data: {
            type,
            title: title.trim(),
            content: content?.trim() || null,
            sourceUrl: sourceUrl?.trim() || null,
            tags: tags ? JSON.stringify(tags) : null
          }
        })

        results.success++
      } catch (e) {
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      total: items.length,
      message: `成功导入 ${results.success} 条，跳过重复 ${results.duplicates} 条，失败 ${results.failed} 条`
    })
  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '批量导入失败' 
    }, { status: 500 })
  }
}
