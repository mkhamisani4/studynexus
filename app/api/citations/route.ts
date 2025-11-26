import { NextRequest, NextResponse } from 'next/server'
import { findCitations } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const sources = await findCitations(content)

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Error finding citations:', error)
    return NextResponse.json({ error: 'Failed to find citations' }, { status: 500 })
  }
}

