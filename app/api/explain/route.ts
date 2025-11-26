import { NextRequest, NextResponse } from 'next/server'
import { generateExplanation } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { concept, context, level, userMaterials } = await request.json()

    if (!concept) {
      return NextResponse.json({ error: 'Concept is required' }, { status: 400 })
    }

    const result = await generateExplanation(
      concept, 
      context || '', 
      level || 'standard',
      userMaterials || []
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating explanation:', error)
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}

