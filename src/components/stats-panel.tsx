'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  FileText,
  Link2,
  Image as ImageIcon,
  Lightbulb,
  Star,
  TrendingUp,
  Sparkles,
  Calendar,
  Tag
} from 'lucide-react'

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']

const typeIcons: Record<string, any> = {
  TEXT: FileText,
  LINK: Link2,
  IMAGE: ImageIcon,
  INSPIRATION: Lightbulb
}

const typeLabels: Record<string, string> = {
  TEXT: '文本',
  LINK: '链接',
  IMAGE: '图片',
  INSPIRATION: '灵感'
}

interface StatsData {
  overview: {
    total: number
    favorites: number
    weeklyNew: number
    todayNew: number
  }
  typeDistribution: Array<{ type: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  aiUsage: {
    summary: number
    tags: number
    inspiration: number
  }
  topTags: Array<{ name: string; count: number }>
}

export function StatsPanel() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        暂无统计数据
      </div>
    )
  }

  return (
    <ScrollArea className="h-full p-6">
      <div className="space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-gray-500">总素材</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-gray-500">收藏</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.favorites}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">本周新增</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.weeklyNew}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500">今日新增</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.todayNew}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 类型分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">素材类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.typeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.typeDistribution.map((t, i) => ({
                        name: typeLabels[t.type] || t.type,
                        value: t.count,
                        fill: COLORS[i % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  暂无数据
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {stats.typeDistribution.map((t, i) => {
                  const Icon = typeIcons[t.type]
                  return (
                    <Badge key={t.type} variant="outline" className="gap-1">
                      <Icon className="w-3 h-3" style={{ color: COLORS[i % COLORS.length] }} />
                      {typeLabels[t.type]}: {t.count}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI 使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI 功能使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { name: 'AI摘要', value: stats.aiUsage.summary, fill: '#10b981' },
                    { name: 'AI标签', value: stats.aiUsage.tags, fill: '#f59e0b' },
                    { name: '灵感方向', value: stats.aiUsage.inspiration, fill: '#8b5cf6' }
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 近30天趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近30天收藏趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(v) => v}
                  formatter={(v: number) => [v, '新增素材']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 热门标签 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              热门标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map((tag, i) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="px-3 py-1"
                    style={{ 
                      fontSize: `${Math.max(12, 16 - i)}px`,
                      backgroundColor: `${COLORS[i % COLORS.length]}20`,
                      color: COLORS[i % COLORS.length]
                    }}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                暂无标签数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
