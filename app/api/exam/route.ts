import { NextRequest, NextResponse } from 'next/server'
import { generateExam } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { materials, duration, difficulty } = await request.json()

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json({ error: 'Materials array is required' }, { status: 400 })
    }

    const exam = await generateExam(materials, duration || 60, difficulty || 'medium')

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error generating exam:', error)
    return NextResponse.json({ error: 'Failed to generate exam' }, { status: 500 })
  }
}

