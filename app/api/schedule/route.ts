import { NextRequest, NextResponse } from 'next/server'
import { generateContentSchedule } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { goals } = await request.json()

    if (!goals || goals.length === 0) {
      return NextResponse.json({ error: 'Goals are required' }, { status: 400 })
    }

    // Generate content-based study plan
    const plan = await generateContentSchedule(goals)

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error generating schedule:', error)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
