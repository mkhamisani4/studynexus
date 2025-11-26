import { NextRequest, NextResponse } from 'next/server'
import { cleanHandwrittenNotes } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const cleanedText = await cleanHandwrittenNotes(imageBase64)

    return NextResponse.json({ cleanedText })
  } catch (error) {
    console.error('Error cleaning notes:', error)
    return NextResponse.json({ error: 'Failed to clean notes' }, { status: 500 })
  }
}

