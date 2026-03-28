import { NextRequest, NextResponse } from 'next/server'

// MediaCrawler API 配置
const MEDIACRAWLER_API = 'http://localhost:8080'

// 平台映射
const platformMap: Record<string, string> = {
  xhs: 'xhs',
  xiaohongshu: 'xhs',
  dy: 'dy',
  douyin: 'dy',
  bili: 'bili',
  bilibili: 'bili',
  wb: 'wb',
  weibo: 'wb',
  ks: 'ks',
  kuaishou: 'ks',
  tieba: 'tieba',
  zhihu: 'zhihu'
}

// 检查 MediaCrawler 服务状态
async function checkCrawlerHealth() {
  try {
    const res = await fetch(`${MEDIACRAWLER_API}/api/health`, {
      signal: AbortSignal.timeout(3000)
    })
    return res.ok
  } catch {
    return false
  }
}

// GET: 获取爬虫状态和平台列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // 获取状态
  if (action === 'status') {
    try {
      const res = await fetch(`${MEDIACRAWLER_API}/api/crawler/status`)
      const data = await res.json()
      return NextResponse.json({
        success: true,
        ...data
      })
    } catch {
      return NextResponse.json({
        success: false,
        status: 'offline',
        message: 'MediaCrawler 服务未启动'
      })
    }
  }

  // 获取日志
  if (action === 'logs') {
    try {
      const res = await fetch(`${MEDIACRAWLER_API}/api/crawler/logs`)
      const data = await res.json()
      return NextResponse.json({
        success: true,
        ...data
      })
    } catch {
      return NextResponse.json({
        success: false,
        logs: [],
        message: '无法获取日志'
      })
    }
  }

  // 默认返回服务状态和平台列表
  const isHealthy = await checkCrawlerHealth()

  return NextResponse.json({
    success: true,
    crawlerOnline: isHealthy,
    message: isHealthy 
      ? 'MediaCrawler 服务正常运行' 
      : 'MediaCrawler 服务未启动，请先启动服务：cd MediaCrawler && uv run uvicorn api.main:app --port 8080',
    platforms: [
      { value: 'xhs', label: '小红书', icon: '📕', color: '#ff2442' },
      { value: 'dy', label: '抖音', icon: '🎵', color: '#000000' },
      { value: 'bili', label: 'B站', icon: '📺', color: '#00a1d6' },
      { value: 'wb', label: '微博', icon: '📢', color: '#ff8200' },
      { value: 'ks', label: '快手', icon: '🎬', color: '#ff5000' },
      { value: 'zhihu', label: '知乎', icon: '💡', color: '#0066ff' },
      { value: 'tieba', label: '贴吧', icon: '💬', color: '#4879bd' }
    ],
    loginTypes: [
      { value: 'qrcode', label: '二维码登录' },
      { value: 'cookie', label: 'Cookie登录' }
    ],
    crawlerTypes: [
      { value: 'search', label: '关键词搜索' },
      { value: 'detail', label: '指定内容ID' },
      { value: 'creator', label: '创作者主页' }
    ]
  })
}

// POST: 启动爬虫任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      platform, 
      loginType = 'qrcode', 
      crawlerType = 'search',
      keywords,
      specifiedIds,
      creatorIds,
      enableComments = false,
      headless = true
    } = body

    // 验证参数
    const mappedPlatform = platformMap[platform.toLowerCase()]
    if (!mappedPlatform) {
      return NextResponse.json({
        success: false,
        message: '不支持的平台'
      }, { status: 400 })
    }

    // 检查服务状态
    const isHealthy = await checkCrawlerHealth()
    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        message: 'MediaCrawler 服务未启动，请先启动服务',
        hint: 'cd /home/z/my-project/MediaCrawler && source .venv/bin/activate && uv run uvicorn api.main:app --port 8080'
      }, { status: 503 })
    }

    // 构建请求体
    const crawlerRequest: Record<string, unknown> = {
      platform: mappedPlatform,
      login_type: loginType,
      crawler_type: crawlerType,
      save_option: 'jsonl',
      start_page: 1,
      enable_comments: enableComments,
      enable_sub_comments: false,
      headless
    }

    if (crawlerType === 'search' && keywords) {
      crawlerRequest.keywords = keywords
    } else if (crawlerType === 'detail' && specifiedIds) {
      crawlerRequest.specified_ids = specifiedIds
    } else if (crawlerType === 'creator' && creatorIds) {
      crawlerRequest.creator_ids = creatorIds
    }

    // 调用 MediaCrawler API
    const res = await fetch(`${MEDIACRAWLER_API}/api/crawler/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crawlerRequest)
    })

    const data = await res.json()

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: '爬虫任务已启动',
        ...data
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.detail || '启动失败',
        ...data
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Crawler start error:', error)
    return NextResponse.json({
      success: false,
      message: '启动爬虫任务失败'
    }, { status: 500 })
  }
}

// DELETE: 停止爬虫任务
export async function DELETE() {
  try {
    const isHealthy = await checkCrawlerHealth()
    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        message: 'MediaCrawler 服务未启动'
      }, { status: 503 })
    }

    const res = await fetch(`${MEDIACRAWLER_API}/api/crawler/stop`, {
      method: 'POST'
    })
    const data = await res.json()

    return NextResponse.json({
      success: res.ok,
      ...data
    })
  } catch (error) {
    console.error('Crawler stop error:', error)
    return NextResponse.json({
      success: false,
      message: '停止爬虫任务失败'
    }, { status: 500 })
  }
}
