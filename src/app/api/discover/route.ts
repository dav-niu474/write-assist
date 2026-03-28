import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// 平台配置
const platforms = {
  wb: { 
    name: '微博', 
    icon: '📢', 
    color: '#ff8200',
    searchQuery: '微博热搜榜 今日热点',
    source: 'weibo.com'
  },
  zhihu: { 
    name: '知乎', 
    icon: '💡', 
    color: '#0066ff',
    searchQuery: '知乎热榜 今日热门问题',
    source: 'zhihu.com'
  },
  dy: { 
    name: '抖音', 
    icon: '🎵', 
    color: '#000000',
    searchQuery: '抖音热搜榜 今日热点',
    source: 'douyin.com'
  },
  bili: { 
    name: 'B站', 
    icon: '📺', 
    color: '#00a1d6',
    searchQuery: 'B站热门排行榜 今日热播',
    source: 'bilibili.com'
  },
  xhs: { 
    name: '小红书', 
    icon: '📕', 
    color: '#ff2442',
    searchQuery: '小红书热搜榜 今日热门',
    source: 'xiaohongshu.com'
  },
  toutiao: {
    name: '今日头条',
    icon: '📰',
    color: '#f85959',
    searchQuery: '今日头条热榜 今日热点新闻',
    source: 'toutiao.com'
  },
  baidu: {
    name: '百度热搜',
    icon: '🔍',
    color: '#2932e1',
    searchQuery: '百度热搜榜 今日热点事件',
    source: 'baidu.com'
  },
  ai: {
    name: 'AI热榜',
    icon: '🤖',
    color: '#8b5cf6',
    searchQuery: 'AI人工智能最新突破 大模型 热点新闻 2024',
    source: 'ai.com'
  }
}

// 简单缓存
const cache = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// AI 热榜实时搜索关键词 - 更具体的热点话题
const aiSearchQueries = [
  'AI人工智能 今日热点 新闻 2026年3月',
  'ChatGPT OpenAI 大模型 最新发布',
  'AI科技 突破 创新 今日头条',
  '人工智能 行业动态 热门事件'
]

// 通过 AI 解析搜索结果，提取热点话题
async function parseHotTopics(searchResults: Array<{name: string; snippet: string; url: string}>, platform: string) {
  try {
    const zai = await ZAI.create()
    
    const prompt = `请从以下搜索结果中提取出具体的热点话题标题，要求：
1. 提取10-15个具体的热点话题名称（如："某明星官宣结婚"、"某地发生地震"等具体事件）
2. 不要提取网站名称、广告、无关内容
3. 每个话题一行，直接输出话题名称
4. 格式：话题名称

搜索结果：
${searchResults.slice(0, 10).map(r => `标题：${r.name}\n摘要：${r.snippet || ''}\n`).join('\n')}

请直接输出话题列表，不要有其他内容：`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是一个热点新闻提取助手，擅长从搜索结果中提取具体的热点话题。直接输出话题列表，每行一个。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const content = completion.choices[0]?.message?.content || ''
    
    // 解析 AI 返回的话题列表
    const topics = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 过滤无效行
        if (line.length < 4 || line.length > 50) return false
        if (line.startsWith('请') || line.startsWith('1.') || line.startsWith('-')) return false
        if (line.includes('搜索结果') || line.includes('提取')) return false
        return true
      })
      .map(line => line.replace(/^\d+[.、)\]]\s*/, '').trim())
      .slice(0, 15)

    return topics
  } catch (error) {
    console.error('Parse topics error:', error)
    return []
  }
}

// 获取 AI 热榜（使用 web 搜索）- 实时最新，保留真实来源
async function fetchAIHotTopics() {
  // 检查缓存（AI热榜缓存时间缩短为2分钟，确保实时性）
  const aiCacheTTL = 2 * 60 * 1000
  const cached = cache.get('ai')
  if (cached && Date.now() - cached.timestamp < aiCacheTTL) {
    return cached.data
  }

  try {
    const zai = await ZAI.create()
    
    // 多次搜索获取更全面的AI热点
    const allResults: Array<{name: string; snippet: string; url: string; host_name: string}> = []
    
    for (const query of aiSearchQueries) {
      try {
        const searchResult = await zai.functions.invoke("web_search", {
          query,
          num: 15
        })
        const results = searchResult as Array<{name: string; snippet: string; url: string; host_name: string}>
        if (results && results.length > 0) {
          allResults.push(...results)
        }
      } catch (e) {
        console.error('Search query failed:', query, e)
      }
    }

    // 过滤掉视频网站、官方文档等非新闻来源
    const blockedDomains = [
      'youtube.com', 'youtu.be', 'bilibili.com', 'vimeo.com', 'tiktok.com', 'douyin.com',
      'help.openai.com', 'platform.openai.com', 'openai.com/blog', 'docs.anthropic.com'
    ]
    const blockedTitlePatterns = [
      /发布说明/i, /Release Notes/i, /官方文档/i, /API文档/i, /Documentation/i,
      /帮助中心/i, /Help Center/i, /隆重推出/i
    ]
    
    const filteredResults = allResults.filter(result => {
      const host = result.host_name.toLowerCase()
      // 过滤禁止的域名
      if (blockedDomains.some(domain => host.includes(domain))) return false
      // 过滤非新闻标题
      if (blockedTitlePatterns.some(pattern => pattern.test(result.name))) return false
      return true
    })
    
    // 去重（按URL去重）
    const seenUrls = new Set<string>()
    let uniqueResults = filteredResults.filter(result => {
      if (seenUrls.has(result.url)) return false
      seenUrls.add(result.url)
      return true
    })
    
    // 按标题相似度去重（移除热点小时报等重复内容）
    const seenTitles = new Set<string>()
    uniqueResults = uniqueResults.filter(result => {
      // 提取标题关键词
      const titleKey = result.name
        .replace(/热点小时报|小时报|热点|日报|速报/gi, '')
        .replace(/\d{4}年\d{1,2}月\d{1,2}日/g, '')
        .replace(/\d{1,2}时/g, '')
        .trim()
        .slice(0, 20)
      
      if (seenTitles.has(titleKey)) return false
      seenTitles.add(titleKey)
      return true
    })
    
    // 直接使用搜索结果，保留真实来源和链接
    const hotItems = uniqueResults.slice(0, 15).map((result, index) => {
      // 清理标题 - 移除网站名后缀和日期等
      const cleanTitle = result.name
        .replace(/\s*[-_|·]\s*(新浪|搜狐|网易|腾讯|今日头条|36氪|虎嗅|钛媒体|雷锋网|机器之心|量子位|AI科技评论|OFweek|CNMO|IT之家|证券时报|新华网|人民网|央视网).*$/gi, '')
        .replace(/\s*[-_|·]\s*\d{4}年\d{1,2}月\d{1,2}日.*$/g, '')
        .replace(/\s*[-_|·]\s*Hot News.*$/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50)
      
      // 提取来源域名并美化
      let source = result.host_name || 'AI领域'
      if (source.startsWith('www.')) {
        source = source.slice(4)
      }
      // 映射常见来源为友好名称
      const sourceMap: Record<string, string> = {
        'k.sina.com.cn': '新浪科技',
        'k.sina.cn': '新浪科技',
        'sina.com.cn': '新浪',
        'news.sina.com.cn': '新浪新闻',
        'ithome.com': 'IT之家',
        '36kr.com': '36氪',
        'huxiu.com': '虎嗅',
        'tmtpost.com': '钛媒体',
        'leiphone.com': '雷锋网',
        'jiqizhixin.com': '机器之心',
        'qbitai.com': '量子位',
        'aibase.com': 'AI基地',
        'news.cn': '新华网',
        'people.com.cn': '人民网',
        'cctv.com': '央视网',
        'bbc.com': 'BBC',
        'cls.cn': '财联社',
        'stcn.com': '证券时报',
        'cnmo.com': 'CNMO',
        'ofweek.com': 'OFweek',
        'toutiao.com': '今日头条',
        'sohu.com': '搜狐',
        '163.com': '网易',
        'qq.com': '腾讯',
        'zhuanlan.zhihu.com': '知乎专栏',
        'zhihu.com': '知乎',
        'baijiahao.baidu.com': '百家号',
        'baidu.com': '百度',
        'openai.com': 'OpenAI',
        'anthropic.com': 'Anthropic',
        'deepmind.com': 'DeepMind',
        'google.com': 'Google',
        'microsoft.com': '微软',
        'fishersama.com': 'AI工具箱',
        'news.softunis.com': '科技快讯',
        'chinadigitaltimes.net': 'CDT',
      }
      source = sourceMap[result.host_name] || source.split('.')[0].toUpperCase()
      
      return {
        id: `hot-ai-${Date.now()}-${index}`,
        platform: 'ai',
        platformName: 'AI热榜',
        platformIcon: '🤖',
        platformColor: '#8b5cf6',
        title: cleanTitle,
        summary: result.snippet || '',
        url: result.url,
        source: source,
        type: 'realtime',
        hotRank: index + 1,
        heat: Math.max(1000000, 9000000 - index * 450000 + Math.floor(Math.random() * 100000)),
        trend: index < 3 ? 'hot' : index < 8 ? 'rising' : 'normal',
        createdAt: new Date().toISOString()
      }
    })

    // 更新缓存
    cache.set('ai', { data: hotItems, timestamp: Date.now() })

    return hotItems
  } catch (error) {
    console.error('Fetch AI hot topics error:', error)
    return getFallbackAITopics()
  }
}

// 通过 AI 解析AI热点话题
async function parseAIHotTopics(searchResults: Array<{name: string; snippet: string; url: string; host_name: string}>) {
  try {
    const zai = await ZAI.create()
    
    const prompt = `请从以下AI人工智能相关的搜索结果中提取出最新的热点话题，要求：
1. 提取15个具体的AI热点话题标题（如："OpenAI发布GPT-5"、"Claude新功能上线"等具体事件）
2. 关注最新的技术突破、产品发布、行业动态
3. 每个话题一行，格式：话题名称|||热度值（1-10的数字）
4. 热度根据话题的重要性和时效性评估

搜索结果：
${searchResults.slice(0, 15).map(r => `标题：${r.name}\n摘要：${r.snippet || ''}\n来源：${r.host_name}\n`).join('\n')}

请直接输出话题列表：`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是一个AI行业热点分析专家，擅长从新闻中提取最新的AI热点话题。只输出话题列表，每行一个，格式为：话题名称|||热度（1-10）' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const content = completion.choices[0]?.message?.content || ''
    
    // 解析 AI 返回的话题列表
    const topics = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (line.length < 4 || line.length > 80) return false
        if (line.startsWith('请') || line.startsWith('搜索') || line.startsWith('以下')) return false
        return true
      })
      .map(line => {
        const parts = line.split('|||')
        const title = parts[0].replace(/^\d+[.、)\]]\s*/, '').trim()
        const heatLevel = parseInt(parts[1]) || 5
        return { title, heatLevel }
      })
      .filter(t => t.title.length >= 4 && t.title.length <= 50)
      .slice(0, 15)

    // 匹配搜索结果获取更多信息
    return topics.map((topic, index) => {
      const matchedResult = searchResults.find(r => 
        r.name.includes(topic.title.slice(0, 15)) || 
        topic.title.includes(r.name.slice(0, 15))
      )
      
      return {
        title: topic.title,
        heat: Math.max(1000000, topic.heatLevel * 1000000 - index * 50000 + Math.random() * 100000),
        summary: matchedResult?.snippet || `${topic.title} - AI领域热门话题`,
        url: matchedResult?.url || '',
        source: matchedResult?.host_name || 'AI领域'
      }
    })
  } catch (error) {
    console.error('Parse AI topics error:', error)
    return []
  }
}

// 后备AI话题
function getFallbackAITopics() {
  const fallbackTopics = [
    { title: 'AI大模型技术持续突破', heat: 8000000 },
    { title: '人工智能应用场景不断拓展', heat: 7500000 },
    { title: 'ChatGPT最新功能更新', heat: 7000000 },
    { title: '国产大模型发展迅速', heat: 6500000 },
    { title: 'AI绘画工具持续创新', heat: 6000000 },
    { title: '企业AI转型加速推进', heat: 5500000 },
    { title: 'AI编程助手效率提升', heat: 5000000 },
    { title: '大模型开源生态建设', heat: 4500000 },
    { title: 'AI安全与监管话题升温', heat: 4000000 },
    { title: 'AI芯片研发竞争激烈', heat: 3500000 }
  ]
  
  return fallbackTopics.map((topic, index) => ({
    id: `ai-fallback-${Date.now()}-${index}`,
    platform: 'ai',
    platformName: 'AI热榜',
    platformIcon: '🤖',
    platformColor: '#8b5cf6',
    title: topic.title,
    summary: `${topic.title} - AI领域热门话题`,
    url: `https://www.google.com/search?q=${encodeURIComponent(topic.title + ' AI 人工智能')}`,
    source: 'AI领域',
    type: 'fallback',
    hotRank: index + 1,
    heat: topic.heat,
    trend: index < 3 ? 'hot' : index < 7 ? 'rising' : 'normal',
    createdAt: new Date().toISOString()
  }))
}

// 获取实时热点
async function fetchRealTimeHotTopics(platform: string) {
  // 特殊处理 AI 热榜
  if (platform === 'ai') {
    return fetchAIHotTopics()
  }

  const platformInfo = platforms[platform as keyof typeof platforms]
  if (!platformInfo) return []

  // 检查缓存
  const cached = cache.get(platform)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const zai = await ZAI.create()
    
    // 单次搜索
    const searchResult = await zai.functions.invoke("web_search", {
      query: platformInfo.searchQuery,
      num: 15
    })

    const results = searchResult as Array<{name: string; snippet: string; url: string; host_name: string}>
    
    let topics: string[] = []
    
    if (results && results.length > 0) {
      // 通过 AI 解析提取具体热点话题
      topics = await parseHotTopics(results, platform)
    }
    
    // 如果解析失败，使用搜索结果标题
    if (topics.length === 0 && results && results.length > 0) {
      topics = results
        .map(r => r.name.replace(/[-_|]\s*.*$/g, '').trim().slice(0, 40))
        .filter(t => t.length >= 4)
        .slice(0, 15)
    }

    // 如果还是没有，使用后备数据
    if (topics.length === 0) {
      return getFallbackTopics(platform)
    }

    // 转换为热点列表
    const hotItems = topics.map((title, index) => ({
      id: `hot-${platform}-${Date.now()}-${index}`,
      platform,
      platformName: platformInfo.name,
      platformIcon: platformInfo.icon,
      platformColor: platformInfo.color,
      title,
      summary: `${title} - 来自${platformInfo.name}的热门话题`,
      url: `https://www.${platformInfo.source}/search?q=${encodeURIComponent(title)}`,
      source: platformInfo.name,
      type: 'realtime',
      hotRank: index + 1,
      heat: generateHeatValue(index),
      trend: index < 3 ? 'hot' : index < 7 ? 'rising' : 'normal',
      createdAt: new Date().toISOString()
    }))

    // 更新缓存
    cache.set(platform, { data: hotItems, timestamp: Date.now() })

    return hotItems
  } catch (error) {
    console.error('Fetch hot topics error:', error)
    return getFallbackTopics(platform)
  }
}

// 生成热度值
function generateHeatValue(rank: number): number {
  const baseHeat = Math.max(100000, 10000000 - rank * 500000)
  return Math.floor(baseHeat + Math.random() * 200000)
}

// 后备热点数据
function getFallbackTopics(platform: string) {
  const platformInfo = platforms[platform as keyof typeof platforms]
  
  const specificTopics: Record<string, string[]> = {
    wb: [
      '今日热点新闻速递',
      '社会热点事件关注',
      '娱乐圈最新动态',
      '体育赛事精彩回顾',
      '国际新闻重点关注',
      '科技行业突破进展',
      '财经股市动态',
      '文化活动精彩纷呈',
      '教育政策新动向',
      '健康养生知识分享'
    ],
    zhihu: [
      '如何评价最新科技突破',
      '职场人如何提升自己',
      '年轻人的人生选择',
      '高效学习方法分享',
      '投资理财经验交流',
      '行业内幕大揭秘',
      '生活中的小确幸',
      '历史事件深度解析',
      '科学知识科普',
      '社会现象深度思考'
    ],
    dy: [
      '网红城市打卡攻略',
      '生活小妙招实用版',
      '美食制作教程分享',
      '旅行Vlog精彩记录',
      '才艺表演惊艳瞬间',
      '萌宠日常治愈时刻',
      '搞笑视频快乐源泉',
      '舞蹈挑战全民参与',
      '健身打卡记录变化',
      '农村生活原生态记录'
    ],
    bili: [
      'UP主精心制作视频',
      '科技数码新品评测',
      '游戏精彩操作集锦',
      '知识科普深度解析',
      '动画制作精良作品',
      '音乐原创作品展示',
      '美食探店真实体验',
      '历史故事精彩讲述',
      '生活日常vlog记录',
      '体育赛事精彩回顾'
    ],
    xhs: [
      '春季穿搭灵感分享',
      '减脂餐食谱推荐',
      '新手化妆教程',
      '护肤心得分享',
      '家居收纳技巧',
      '旅行攻略分享',
      '职场穿搭提升',
      '美食探店打卡',
      '租房改造灵感',
      '健身打卡记录'
    ],
    toutiao: [
      '国际新闻最新动态',
      '国内经济形势分析',
      '社会民生热点事件',
      '体育赛事精彩瞬间',
      '科技行业最新突破',
      '娱乐圈热点追踪',
      '教育政策新变化',
      '健康养生小知识',
      '汽车行业新动向',
      '房产市场新消息'
    ],
    baidu: [
      '今日热搜事件',
      '网友关注热点',
      '明星动态追踪',
      '科技新闻热点',
      '体育赛事关注',
      '影视娱乐资讯',
      '游戏行业动态',
      '财经股市行情',
      '教育考试信息',
      '健康科普知识'
    ]
  }

  const topics = specificTopics[platform] || specificTopics.wb

  return topics.map((topic, index) => ({
    id: `fallback-${platform}-${Date.now()}-${index}`,
    platform,
    platformName: platformInfo?.name || platform,
    platformIcon: platformInfo?.icon || '📱',
    platformColor: platformInfo?.color || '#666',
    title: topic,
    summary: `${topic} - 当前热门话题`,
    url: `https://www.${platformInfo?.source || platform}.com/search?q=${encodeURIComponent(topic)}`,
    source: platformInfo?.name || platform,
    type: 'fallback',
    hotRank: index + 1,
    heat: generateHeatValue(index),
    trend: index < 3 ? 'hot' : index < 7 ? 'rising' : 'normal',
    createdAt: new Date().toISOString()
  }))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'wb'

  try {
    const items = await fetchRealTimeHotTopics(platform)

    return NextResponse.json({
      success: true,
      platform,
      platformInfo: platforms[platform as keyof typeof platforms],
      items,
      total: items.length,
      message: items.length > 0 ? '获取成功' : '暂无热点数据',
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Hot topics API error:', error)
    return NextResponse.json({
      success: false,
      items: getFallbackTopics(platform),
      message: '获取热点失败，显示推荐内容'
    })
  }
}

// 搜索热点
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword) {
      return NextResponse.json({
        success: false,
        message: '请输入搜索关键词'
      }, { status: 400 })
    }

    const zai = await ZAI.create()
    
    // 搜索相关热点
    const searchResult = await zai.functions.invoke("web_search", {
      query: `${keyword} 热点 新闻`,
      num: 15
    })

    const results = searchResult as Array<{name: string; snippet: string; url: string; host_name: string}>
    
    // 解析为热点列表
    const items = results.slice(0, 15).map((item, index) => ({
      id: `search-${Date.now()}-${index}`,
      platform: 'search',
      platformName: '全网搜索',
      platformIcon: '🔍',
      platformColor: '#6366f1',
      title: item.name.replace(/[-_|]\s*.*$/g, '').trim().slice(0, 50),
      summary: item.snippet || '',
      url: item.url,
      source: item.host_name,
      type: 'search',
      hotRank: index + 1,
      heat: generateHeatValue(index),
      trend: index < 3 ? 'hot' : index < 7 ? 'rising' : 'normal',
      createdAt: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      keyword,
      items,
      total: items.length,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({
      success: false,
      items: [],
      message: '搜索失败，请稍后重试'
    }, { status: 500 })
  }
}
