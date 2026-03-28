import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取素材统计数据
export async function GET() {
  try {
    // 总数统计
    const totalCount = await db.material.count()
    
    // 按类型统计
    const typeStats = await db.material.groupBy({
      by: ['type'],
      _count: { id: true }
    })
    
    // 收藏统计
    const favoriteCount = await db.material.count({
      where: { isFavorite: true }
    })
    
    // 本周新增
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyCount = await db.material.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    })
    
    // 今日新增
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await db.material.count({
      where: {
        createdAt: { gte: today }
      }
    })
    
    // 按日期统计（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const materials = await db.material.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true
      }
    })
    
    // 按日期分组
    const dailyStats: Record<string, number> = {}
    materials.forEach(m => {
      const date = m.createdAt.toISOString().split('T')[0]
      dailyStats[date] = (dailyStats[date] || 0) + 1
    })
    
    // 填充空缺日期
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = 0
      }
    }
    
    // 转换为数组并排序
    const dailyTrend = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
    
    // AI 功能使用统计
    const aiSummaryCount = await db.material.count({
      where: { summary: { not: null } }
    })
    const aiTagsCount = await db.material.count({
      where: { aiTags: { not: null } }
    })
    const inspirationCount = await db.material.count({
      where: { inspirationHint: { not: null } }
    })
    
    // 获取所有标签统计
    const allMaterials = await db.material.findMany({
      where: { tags: { not: null } },
      select: { tags: true }
    })
    
    const tagCounts: Record<string, number> = {}
    allMaterials.forEach(m => {
      if (m.tags) {
        try {
          const tags = JSON.parse(m.tags)
          tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        } catch (e) {
          // ignore
        }
      }
    })
    
    const topTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return NextResponse.json({
      success: true,
      overview: {
        total: totalCount,
        favorites: favoriteCount,
        weeklyNew: weeklyCount,
        todayNew: todayCount
      },
      typeDistribution: typeStats.map(s => ({
        type: s.type,
        count: s._count.id
      })),
      dailyTrend,
      aiUsage: {
        summary: aiSummaryCount,
        tags: aiTagsCount,
        inspiration: inspirationCount
      },
      topTags
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取统计数据失败' 
    }, { status: 500 })
  }
}
