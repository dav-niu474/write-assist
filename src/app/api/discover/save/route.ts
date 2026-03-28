import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 保存发现的内容到素材库
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      content, 
      sourceUrl, 
      platform,
      platformName,
      summary
    } = body

    if (!title) {
      return NextResponse.json({
        success: false,
        message: '标题不能为空'
      }, { status: 400 })
    }

    // 创建素材
    const material = await db.material.create({
      data: {
        type: 'LINK',
        title,
        content: content || summary || null,
        sourceUrl: sourceUrl || null,
        tags: platform ? JSON.stringify([platformName || platform]) : null,
        summary: summary || null
      }
    })

    return NextResponse.json({
      success: true,
      message: '已保存到素材库',
      material
    })
  } catch (error) {
    console.error('Save to materials error:', error)
    return NextResponse.json({
      success: false,
      message: '保存失败'
    }, { status: 500 })
  }
}
