import { NextRequest, NextResponse } from 'next/server'

// POST /api/materials/parse-link - Parse web link
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()

    // Extract title
    let title = ''
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }

    // Extract meta description
    let description = ''
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) {
      description = descMatch[1].trim()
    }

    // Extract og:image
    const images: string[] = []
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    if (ogImageMatch) {
      images.push(ogImageMatch[1])
    }

    // Extract main content (simplified)
    // Remove scripts, styles, and comments
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Limit content length
    if (content.length > 2000) {
      content = content.slice(0, 2000) + '...'
    }

    return NextResponse.json({
      title: title || 'Untitled',
      description,
      content,
      images
    })
  } catch (error) {
    console.error('Error parsing link:', error)
    return NextResponse.json(
      { error: 'Failed to parse link' },
      { status: 500 }
    )
  }
}
