import { NextRequest, NextResponse } from 'next/server'
import { summarizeResearchPaper } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { paperContent } = await request.json()

    if (!paperContent) {
      return NextResponse.json({ error: 'Paper content is required' }, { status: 400 })
    }

    const analysis = await summarizeResearchPaper(paperContent)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing research paper:', error)
    return NextResponse.json({ error: 'Failed to analyze paper' }, { status: 500 })
  }
}

