import { NextRequest, NextResponse } from 'next/server'
import { generateQuizFromContent } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { content, numQuestions } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const questions = await generateQuizFromContent(content, numQuestions || 5)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}

