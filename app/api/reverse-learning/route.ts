import { NextRequest, NextResponse } from 'next/server'
import { reverseLearningPath } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { problem, subject } = await request.json()

    if (!problem || !subject) {
      return NextResponse.json({ error: 'Problem and subject are required' }, { status: 400 })
    }

    const path = await reverseLearningPath(problem, subject)

    return NextResponse.json(path)
  } catch (error) {
    console.error('Error generating reverse learning path:', error)
    return NextResponse.json({ error: 'Failed to generate learning path' }, { status: 500 })
  }
}

