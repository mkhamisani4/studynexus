import { NextRequest, NextResponse } from 'next/server'
import { chatWithContext } from '@/lib/openai'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create Supabase client with cookies from request
    const cookieHeader = request.headers.get('cookie') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Cookie: cookieHeader
        }
      }
    })
    
    let userData: any = null

    try {
      // Try to get user from session
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (user && !authError) {
        // Fetch user's study materials
        const { data: materials } = await supabase
          .from('study_materials')
          .select('id, title, content, subject')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        // Fetch user's concepts
        const { data: concepts } = await supabase
          .from('concepts')
          .select('id, name, description, mastery_level, subject')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        // Fetch recent study sessions
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('subject, duration_minutes, performance_score, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        // Fetch recent exam results
        const { data: exams } = await supabase
          .from('exams')
          .select('subject, score, completed, created_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(10)

        userData = {
          materials: materials || [],
          concepts: concepts || [],
          sessions: sessions || [],
          exams: exams || []
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Continue without user data if there's an error
    }

    const response = await chatWithContext(
      message,
      conversationHistory || [],
      userData
    )

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 })
  }
}

