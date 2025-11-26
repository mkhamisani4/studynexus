'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, TrendingUp, Target, Zap, Calendar, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

interface CoachMessage {
  type: 'motivation' | 'feedback' | 'suggestion'
  content: string
  timestamp: string
}

export default function StudyCoach() {
  const { showError } = useNotifications()
  const [streak, setStreak] = useState(0)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [focusItems, setFocusItems] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [weeklyStats, setWeeklyStats] = useState({
    studyHours: 0,
    materialsReviewed: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [generatingMessages, setGeneratingMessages] = useState(false)

  useEffect(() => {
    loadCoachData()
  }, [])

  const loadCoachData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load all data in parallel
      const [
        profile,
        sessions,
        materials,
        exams,
        concepts,
        flashcards
      ] = await Promise.all([
        supabase.from('learning_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('study_sessions').select('*').eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('study_materials').select('id').eq('user_id', user.id),
        supabase.from('exams').select('score').eq('user_id', user.id).eq('completed', true),
        supabase.from('concepts').select('*').eq('user_id', user.id),
        supabase.from('flashcards').select('*').eq('user_id', user.id)
      ])

      const profileData = profile.data
      const sessionsData = sessions.data || []
      const materialsData = materials.data || []
      const examsData = exams.data || []
      const conceptsData = concepts.data || []
      const flashcardsData = flashcards.data || []

      // Calculate streak
      setStreak(profileData?.study_streak_days || 0)

      // Calculate weekly stats
      const totalHours = sessionsData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
      const avgScore = examsData.length > 0
        ? Math.round(examsData.reduce((sum, e) => sum + (e.score || 0), 0) / examsData.length)
        : 0

      setWeeklyStats({
        studyHours: Math.round(totalHours * 10) / 10,
        materialsReviewed: materialsData.length,
        averageScore: avgScore
      })

      // Calculate achievements
      const newAchievements = []
      if (streak >= 5) newAchievements.push({ title: `${streak} Day Streak`, icon: Calendar, color: 'orange' })
      if (examsData.length >= 10) newAchievements.push({ title: '10 Exams Completed', icon: Target, color: 'purple' })
      const masteredFlashcards = flashcardsData.filter((f: any) => f.times_correct > f.times_incorrect * 2).length
      if (masteredFlashcards >= 100) newAchievements.push({ title: '100 Flashcards Mastered', icon: Zap, color: 'green' })
      if (avgScore >= 85) newAchievements.push({ title: 'Top Performer', icon: TrendingUp, color: 'blue' })
      setAchievements(newAchievements)

      // Generate focus items from weak concepts
      const weakConcepts = conceptsData
        .filter((c: any) => (c.mastery_level || 0) < 60)
        .slice(0, 3)
        .map((c: any) => ({
          type: 'concept',
          title: `Review ${c.name}`,
          description: `Focus on ${c.name} - it's a weak area`,
          subject: c.subject
        }))

      // Get due flashcards
      const dueFlashcards = flashcardsData.filter((f: any) => 
        !f.next_review_date || new Date(f.next_review_date) <= new Date()
      ).length

      if (dueFlashcards > 0) {
        focusItems.push({
          type: 'flashcards',
          title: `Complete ${Math.min(dueFlashcards, 20)} flashcards`,
          description: 'Spaced repetition practice',
          count: dueFlashcards
        })
      }

      setFocusItems([...weakConcepts, ...focusItems])

      // Generate AI coach messages
      await generateCoachMessages(profileData, sessionsData, examsData, conceptsData)
    } catch (error) {
      console.error('Error loading coach data:', error)
      showError('Load Failed', 'Failed to load coach data')
    } finally {
      setLoading(false)
    }
  }

  const generateCoachMessages = async (profile: any, sessions: any[], exams: any[], concepts: any[]) => {
    setGeneratingMessages(true)
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streak: profile?.study_streak_days || 0,
          recentSessions: sessions.slice(0, 5),
          recentExams: exams.slice(0, 3),
          weakConcepts: concepts.filter((c: any) => (c.mastery_level || 0) < 60).slice(0, 5),
          strongConcepts: concepts.filter((c: any) => (c.mastery_level || 0) >= 80).slice(0, 5)
        })
      })

      if (!response.ok) throw new Error('Failed to generate messages')

      const { messages: generatedMessages } = await response.json()
      setMessages(generatedMessages || [])
    } catch (error) {
      console.error('Error generating messages:', error)
      // Fallback to basic messages
      const fallbackMessages: CoachMessage[] = []
      if (streak > 0) {
        fallbackMessages.push({
          type: 'motivation',
          content: `Great job! You've maintained a ${streak}-day study streak. Keep it up! 🔥`,
          timestamp: 'Just now'
        })
      }
      if (exams.length > 0) {
        const recentExam = exams[0]
        fallbackMessages.push({
          type: 'feedback',
          content: `Your most recent exam score was ${recentExam.score}%. ${recentExam.score >= 80 ? 'Excellent work!' : 'Keep practicing!'}`,
          timestamp: 'Recently'
        })
      }
      setMessages(fallbackMessages)
    } finally {
      setGeneratingMessages(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Coach</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Your AI mentor for motivation and personalized feedback</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Coach</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Your AI mentor for motivation and personalized feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Coach Messages</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Personalized feedback and motivation</p>
                </div>
              </div>
              {generatingMessages && (
                <Loader2 className="w-5 h-5 text-gray-400 dark:text-gray-500 animate-spin" />
              )}
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start studying to get personalized feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        msg.type === 'motivation' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                        msg.type === 'feedback' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {msg.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Today's Focus</h2>
            {focusItems.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No focus items. Keep studying to get recommendations!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {focusItems.map((item, idx) => {
                  const Icon = item.type === 'concept' ? Target : item.type === 'flashcards' ? Zap : Calendar
                  const isConcept = item.type === 'concept'
                  const isFlashcards = item.type === 'flashcards'
                  return (
                    <div key={idx} className={`flex items-center space-x-3 p-3 ${
                      isConcept ? 'bg-blue-50 dark:bg-blue-900/20' :
                      isFlashcards ? 'bg-green-50 dark:bg-green-900/20' :
                      'bg-purple-50 dark:bg-purple-900/20'
                    } rounded-lg`}>
                      <Icon className={`w-5 h-5 ${
                        isConcept ? 'text-blue-600 dark:text-blue-400' :
                        isFlashcards ? 'text-green-600 dark:text-green-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <span className="text-3xl font-bold">{streak}</span>
            </div>
            <h3 className="font-semibold mb-1">Day Streak</h3>
            <p className="text-sm opacity-90">Keep studying to maintain your streak!</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
            {achievements.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep studying to unlock achievements!</p>
            ) : (
              <div className="space-y-3">
                {achievements.map((achievement, idx) => {
                  const Icon = achievement.icon
                  const colorClasses = {
                    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  }
                  return (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className={`w-10 h-10 ${colorClasses[achievement.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{achievement.title}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Weekly Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Study Hours</span>
                  <span className="font-medium text-gray-900 dark:text-white">{weeklyStats.studyHours}h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(weeklyStats.studyHours / 30 * 100, 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Materials Reviewed</span>
                  <span className="font-medium text-gray-900 dark:text-white">{weeklyStats.materialsReviewed}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(weeklyStats.materialsReviewed / 20 * 100, 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Average Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">{weeklyStats.averageScore}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full" style={{ width: `${weeklyStats.averageScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
