import { NextRequest, NextResponse } from 'next/server'

// MediaCrawler API 地址
const MEDIACRAWLER_URL = process.env.MEDIACRAWLER_URL || 'http://localhost:8080'

// 代理到 MediaCrawler API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    const platform = searchParams.get('platform') || ''
    const keyword = searchParams.get('keyword') || ''
    
    // 构建目标URL
    let targetUrl = `${MEDIACRAWLER_URL}/api`
    
    if (path === 'platforms') {
      targetUrl += '/platforms'
    } else if (path === 'data') {
      targetUrl += `/data/${platform}?keyword=${encodeURIComponent(keyword)}`
    } else if (path === 'status') {
      targetUrl += '/crawler/status'
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid path' 
      }, { status: 400 })
    }
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Crawler GET error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '无法连接到 MediaCrawler 服务，请确保服务正在运行'
    }, { status: 500 })
  }
}

// 启动爬虫任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, keywords, maxNotes } = body
    
    // 调用 MediaCrawler API 启动爬虫
    const response = await fetch(`${MEDIACRAWLER_URL}/api/crawler/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform,
        keywords: keywords.split(',').map((k: string) => k.trim()),
        max_notes: maxNotes || 10
      })
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Crawler POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '启动爬虫失败' 
    }, { status: 500 })
  }
}
