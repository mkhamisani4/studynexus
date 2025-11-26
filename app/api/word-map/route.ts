import { NextRequest, NextResponse } from 'next/server'
import { extractWordsFromDocuments, generateQuestionsFromWord } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { action, materials, word } = await request.json()

    if (action === 'extract') {
      // Extract key words/terms from documents
      if (!materials || materials.length === 0) {
        return NextResponse.json({ error: 'Materials are required' }, { status: 400 })
      }

      const words = await extractWordsFromDocuments(materials)
      return NextResponse.json({ words })
    }

    if (action === 'generate-questions') {
      // Generate questions for a specific word
      if (!word || !materials) {
        return NextResponse.json({ error: 'Word and materials are required' }, { status: 400 })
      }

      const questions = await generateQuestionsFromWord(word, materials)
      return NextResponse.json({ questions })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in word map API:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

