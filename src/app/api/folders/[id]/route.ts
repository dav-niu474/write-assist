import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取单个文件夹
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const folder = await db.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materials: true }
        },
        children: true,
        materials: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ success: false, error: '文件夹不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error('Get folder error:', error)
    return NextResponse.json({ success: false, error: '获取文件夹失败' }, { status: 500 })
  }
}

// 更新文件夹
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, icon, color, description, parentId } = await request.json()

    const folder = await db.folder.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId: parentId || null })
      }
    })

    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error('Update folder error:', error)
    return NextResponse.json({ success: false, error: '更新文件夹失败' }, { status: 500 })
  }
}

// 删除文件夹
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 检查是否有子文件夹
    const children = await db.folder.count({
      where: { parentId: id }
    })

    if (children > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请先删除子文件夹' 
      }, { status: 400 })
    }

    // 检查是否有素材
    const materials = await db.material.count({
      where: { folderId: id }
    })

    if (materials > 0) {
      // 将素材移动到根目录
      await db.material.updateMany({
        where: { folderId: id },
        data: { folderId: null }
      })
    }

    await db.folder.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json({ success: false, error: '删除文件夹失败' }, { status: 500 })
  }
}
