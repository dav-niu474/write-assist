import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取所有文件夹
export async function GET() {
  try {
    const folders = await db.folder.findMany({
      include: {
        _count: {
          select: { materials: true }
        },
        children: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // 构建树形结构
    const folderMap = new Map()
    const rootFolders: any[] = []

    // 第一遍：创建映射
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // 第二遍：构建树
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(node)
      } else {
        rootFolders.push(node)
      }
    })

    return NextResponse.json({
      success: true,
      folders: rootFolders,
      flatFolders: folders
    })
  } catch (error) {
    console.error('Get folders error:', error)
    return NextResponse.json({ success: false, error: '获取文件夹失败' }, { status: 500 })
  }
}

// 创建文件夹
export async function POST(request: NextRequest) {
  try {
    const { name, icon, color, description, parentId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: '文件夹名称不能为空' }, { status: 400 })
    }

    // 检查同级是否有重名
    const existing = await db.folder.findFirst({
      where: { 
        name: name.trim(),
        parentId: parentId || null
      }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: '同级已存在同名文件夹' }, { status: 400 })
    }

    // 获取最大排序值
    const maxSort = await db.folder.aggregate({
      where: { parentId: parentId || null },
      _max: { sortOrder: true }
    })

    const folder = await db.folder.create({
      data: {
        name: name.trim(),
        icon: icon || '📁',
        color: color || '#6366f1',
        description,
        parentId: parentId || null,
        sortOrder: (maxSort._max.sortOrder || 0) + 1
      }
    })

    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ success: false, error: '创建文件夹失败' }, { status: 500 })
  }
}
