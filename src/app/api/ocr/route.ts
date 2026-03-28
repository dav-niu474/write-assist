import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

// OCR 识别 - 支持中英文
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const lang = formData.get('lang') as string || 'chi_sim+eng' // 默认中英文

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: '请上传图片文件' 
      }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: '不支持的图片格式，请上传 JPG/PNG/GIF/WebP/BMP 格式' 
      }, { status: 400 })
    }

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 执行 OCR 识别
    const result = await Tesseract.recognize(
      buffer,
      lang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      }
    )

    const text = result.data.text.trim()
    const confidence = result.data.confidence

    // 提取关键信息
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const words = text.split(/\s+/).filter(word => word.length > 0)

    return NextResponse.json({
      success: true,
      text,
      confidence: Math.round(confidence * 100) / 100,
      stats: {
        lines: lines.length,
        words: words.length,
        characters: text.length
      },
      // 按行分割的结果
      lines: lines.map(line => line.trim())
    })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'OCR识别失败，请稍后重试' 
    }, { status: 500 })
  }
}
