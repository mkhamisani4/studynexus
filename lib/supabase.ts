import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Database types
export interface StudyMaterial {
  id: string
  user_id: string
  title: string
  content: string
  file_type: string
  file_url?: string
  subject: string
  created_at: string
  updated_at: string
}

export interface Concept {
  id: string
  user_id: string
  name: string
  description: string
  subject: string
  mastery_level: number // 0-100
  relationships: string[] // Array of concept IDs
  created_at: string
}

export interface Flashcard {
  id: string
  user_id: string
  concept_id?: string
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  mode: 'text' | 'image' | 'fill_blank' | 'multiple_choice' | 'code'
  options?: string[]
  image_url?: string
  times_correct: number
  times_incorrect: number
  last_reviewed?: string
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject: string
  duration_minutes: number
  activities: string[]
  performance_score?: number
  created_at: string
}

export interface Exam {
  id: string
  user_id: string
  subject: string
  duration_minutes: number
  questions: ExamQuestion[]
  predicted_difficulty: 'easy' | 'medium' | 'hard'
  completed: boolean
  score?: number
  created_at: string
}

export interface ExamQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'code'
  options?: string[]
  correct_answer: string
  points: number
  user_answer?: string
  is_correct?: boolean
}

export interface StudyGroup {
  id: string
  name: string
  subject: string
  member_ids: string[]
  shared_quizzes: string[]
  study_plan: string
  created_at: string
}

export interface LearningProfile {
  id: string
  user_id: string
  learning_style: 'spaced_repetition' | 'slow_burn' | 'burst' | 'mixed'
  weak_concepts: string[]
  strong_concepts: string[]
  study_streak_days: number
  last_study_date?: string
  energy_levels: { date: string; level: number }[]
  created_at: string
  updated_at: string
}

