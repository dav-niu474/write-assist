import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST /api/materials/upload - Upload image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string || '未命名图片'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Generate filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Save file
    const filepath = path.join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create material record
    const material = await db.material.create({
      data: {
        type: 'IMAGE',
        title,
        images: JSON.stringify([`/uploads/${filename}`]),
        ocrText: 'OCR功能需安装Tesseract' // Placeholder for MVP
      }
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
