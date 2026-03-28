import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 导出素材
export async function POST(request: NextRequest) {
  try {
    const { 
      format = 'markdown', // markdown, json, txt
      materialIds = [],
      folderId = null,
      includeSummary = true,
      includeTags = true,
      includeAIContent = true
    } = await request.json()

    // 获取素材
    let materials: any[] = []
    
    if (materialIds.length > 0) {
      materials = await db.material.findMany({
        where: { id: { in: materialIds } },
        orderBy: { createdAt: 'desc' }
      })
    } else if (folderId) {
      materials = await db.material.findMany({
        where: { folderId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      materials = await db.material.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    }

    if (materials.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '没有可导出的素材' 
      }, { status: 400 })
    }

    let content = ''
    const timestamp = new Date().toISOString().split('T')[0]

    switch (format) {
      case 'json':
        const exportData = materials.map(m => ({
          id: m.id,
          type: m.type,
          title: m.title,
          content: m.content,
          sourceUrl: m.sourceUrl,
          tags: m.tags ? JSON.parse(m.tags) : [],
          ...(includeSummary && { summary: m.summary }),
          ...(includeAIContent && { 
            aiTags: m.aiTags ? JSON.parse(m.aiTags) : [],
            inspirationHint: m.inspirationHint 
          }),
          createdAt: m.createdAt
        }))
        content = JSON.stringify(exportData, null, 2)
        break

      case 'txt':
        content = materials.map(m => {
          let text = `【${m.title}】\n`
          text += `类型: ${m.type} | 创建时间: ${new Date(m.createdAt).toLocaleDateString('zh-CN')}\n`
          if (m.sourceUrl) text += `来源: ${m.sourceUrl}\n`
          text += `\n${m.content || '无内容'}\n`
          if (includeSummary && m.summary) text += `\n摘要: ${m.summary}\n`
          if (includeTags && m.tags) text += `标签: ${m.tags}\n`
          return text + '\n' + '─'.repeat(40) + '\n'
        }).join('\n')
        break

      default: // markdown
        content = `# 素材导出\n\n`
        content += `> 导出时间: ${new Date().toLocaleDateString('zh-CN')} | 共 ${materials.length} 条素材\n\n`
        content += `---\n\n`
        
        materials.forEach((m, index) => {
          content += `## ${index + 1}. ${m.title}\n\n`
          content += `**类型**: ${m.type} | **创建时间**: ${new Date(m.createdAt).toLocaleDateString('zh-CN')}\n\n`
          
          if (m.sourceUrl) {
            content += `**来源链接**: [${m.sourceUrl}](${m.sourceUrl})\n\n`
          }
          
          if (m.content) {
            content += `### 内容\n\n${m.content}\n\n`
          }
          
          if (includeSummary && m.summary) {
            content += `### AI摘要\n\n${m.summary}\n\n`
          }
          
          if (includeTags && m.tags) {
            try {
              const tags = JSON.parse(m.tags)
              if (tags.length > 0) {
                content += `**标签**: ${tags.map((t: string) => `\`${t}\``).join(' ')}\n\n`
              }
            } catch (e) {
              // ignore
            }
          }
          
          if (includeAIContent && m.inspirationHint) {
            content += `### 灵感方向\n\n${m.inspirationHint}\n\n`
          }
          
          content += `---\n\n`
        })
    }

    return NextResponse.json({
      success: true,
      content,
      format,
      count: materials.length,
      filename: `materials-export-${timestamp}.${format === 'json' ? 'json' : format === 'txt' ? 'txt' : 'md'}`
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 })
  }
}
