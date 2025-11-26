import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { content, numCards } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const flashcards = await generateFlashcards(content, numCards || 10)

    return NextResponse.json({ flashcards })
  } catch (error) {
    console.error('Error generating flashcards:', error)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}

