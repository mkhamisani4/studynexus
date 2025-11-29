import { NextRequest, NextResponse } from 'next/server'
import { generateExplanation } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { question, userMaterials } = await request.json()

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (!userMaterials || userMaterials.length === 0) {
      return NextResponse.json({ error: 'At least one note must be selected' }, { status: 400 })
    }

    const result = await generateExplanation(
      question.trim(),
      userMaterials || []
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating explanation:', error)
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}

