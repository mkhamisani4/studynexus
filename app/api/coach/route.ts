import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyDigest } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { streak, recentSessions, recentExams, weakConcepts, strongConcepts } = await request.json()

    // Generate motivational messages using OpenAI
    const progress = {
      streak,
      recentSessions: recentSessions?.length || 0,
      recentExams: recentExams?.length || 0,
      weakAreas: weakConcepts?.map((c: any) => c.name) || [],
      strongAreas: strongConcepts?.map((c: any) => c.name) || []
    }

    const digest = await generateWeeklyDigest(
      progress,
      progress.weakAreas,
      progress.strongAreas
    )

    // Parse the digest and create structured messages
    const messages: Array<{ type: string; content: string; timestamp: string }> = []

    // Add streak message if applicable
    if (streak > 0) {
      messages.push({
        type: 'motivation',
        content: `Great job! You've maintained a ${streak}-day study streak. Keep it up! 🔥`,
        timestamp: 'Just now'
      })
    }

    // Add performance feedback
    if (recentExams && recentExams.length > 0) {
      const latestExam = recentExams[0]
      const improvement = recentExams.length > 1 
        ? latestExam.score - recentExams[1].score 
        : 0
      
      if (improvement > 0) {
        messages.push({
          type: 'feedback',
          content: `Your performance improved by ${improvement}%! Your latest exam score was ${latestExam.score}%. Excellent progress!`,
          timestamp: 'Recently'
        })
      } else if (latestExam.score >= 80) {
        messages.push({
          type: 'feedback',
          content: `Your latest exam score was ${latestExam.score}%. You're doing great! Keep up the excellent work!`,
          timestamp: 'Recently'
        })
      } else {
        messages.push({
          type: 'feedback',
          content: `Your latest exam score was ${latestExam.score}%. Focus on reviewing weak areas to improve.`,
          timestamp: 'Recently'
        })
      }
    }

    // Add suggestions based on weak concepts
    if (weakConcepts && weakConcepts.length > 0) {
      const weakNames = weakConcepts.slice(0, 3).map((c: any) => c.name).join(', ')
      messages.push({
        type: 'suggestion',
        content: `Based on your performance, consider reviewing: ${weakNames}. These are areas that need more practice.`,
        timestamp: 'Today'
      })
    }

    // Add AI-generated message from digest
    if (digest && digest.length > 0) {
      // Extract key points from digest
      const sentences = digest.split(/[.!?]+/).filter(s => s.trim().length > 20)
      if (sentences.length > 0) {
        messages.push({
          type: 'motivation',
          content: sentences[0].trim() + '.',
          timestamp: 'Today'
        })
      }
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error generating coach messages:', error)
    return NextResponse.json({ error: 'Failed to generate messages' }, { status: 500 })
  }
}

