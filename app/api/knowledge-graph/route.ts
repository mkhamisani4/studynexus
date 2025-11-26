import { NextRequest, NextResponse } from 'next/server'
import { buildKnowledgeGraph } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { materials } = await request.json()

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json({ error: 'Materials array is required' }, { status: 400 })
    }

    const graph = await buildKnowledgeGraph(materials)

    return NextResponse.json(graph)
  } catch (error) {
    console.error('Error building knowledge graph:', error)
    return NextResponse.json({ error: 'Failed to build knowledge graph' }, { status: 500 })
  }
}

