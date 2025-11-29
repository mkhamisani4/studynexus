'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BookOpen, Target, Zap, Calendar, Brain, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardViewProps {
  setActiveView: (view: string, data?: any) => void
}

export default function DashboardView({ setActiveView }: DashboardViewProps) {
  const [stats, setStats] = useState({
    studyStreak: 0,
    materialsUploaded: 0,
    conceptsMastered: 0,
    examsCompleted: 0,
    averageScore: 0,
    studyHours: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load all stats in parallel
      const [materials, concepts, exams, sessions, profile] = await Promise.all([
        supabase.from('study_materials').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('concepts').select('id', { count: 'exact' }).eq('user_id', user.id).gte('mastery_level', 80),
        supabase.from('exams').select('score').eq('user_id', user.id).eq('completed', true),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id),
        supabase.from('learning_profiles').select('study_streak_days').eq('user_id', user.id).single()
      ])

      const materialsCount = materials.count || 0
      const conceptsCount = concepts.count || 0
      const examsData = exams.data || []
      const sessionsData = sessions.data || []
      const profileData = profile.data

      const totalHours = sessionsData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
      const avgScore = examsData.length > 0
        ? Math.round(examsData.reduce((sum, e) => sum + (e.score || 0), 0) / examsData.length)
        : 0

      setStats({
        studyStreak: profileData?.study_streak_days || 0,
        materialsUploaded: materialsCount,
        conceptsMastered: conceptsCount,
        examsCompleted: examsData.length,
        averageScore: avgScore,
        studyHours: Math.round(totalHours * 10) / 10
      })

      // Load recent activity
      const [recentMaterials, recentExams, recentSessions] = await Promise.all([
        supabase.from('study_materials').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('exams').select('id, subject, score, created_at').eq('user_id', user.id).eq('completed', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('study_sessions').select('id, subject, duration_minutes, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      ])

      const activities: any[] = []
      
      recentMaterials.data?.forEach((m: any) => {
        activities.push({
          type: 'material',
          title: `Uploaded "${m.title}"`,
          time: m.created_at,
          icon: BookOpen
        })
      })

      recentExams.data?.forEach((e: any) => {
        activities.push({
          type: 'exam',
          title: `Completed ${e.subject} exam (${e.score}%)`,
          time: e.created_at,
          icon: Target
        })
      })

      recentSessions.data?.forEach((s: any) => {
        activities.push({
          type: 'session',
          title: `Studied ${s.subject} for ${s.duration_minutes} minutes`,
          time: s.created_at,
          icon: Calendar
        })
      })

      // Sort by time and take most recent 6
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activities.slice(0, 6))
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { title: 'Upload Notes', description: 'Add new study materials', icon: BookOpen, color: 'blue', view: 'materials' },
    { title: 'Take Exam', description: 'Generate practice exam', icon: Target, color: 'purple', view: 'exam-mode' },
    { title: 'Review Flashcards', description: 'Practice with AI cards', icon: Zap, color: 'green', view: 'flashcards' },
    { title: 'View Word Map', description: 'Explore concept relationships', icon: Brain, color: 'orange', view: 'knowledge-graph' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back! 👋</h1>
          <p className="text-gray-600 dark:text-gray-300">Loading your stats...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back! 👋</h1>
        <p className="text-gray-600 dark:text-gray-300">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Streak</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.studyStreak} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Materials Uploaded</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.materialsUploaded}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Concepts Mastered</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.conceptsMastered}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exams Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.examsCompleted}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Hours</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.studyHours}h</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
              purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30',
              green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30',
              orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30',
            }
            const iconColorClasses = {
              blue: 'text-blue-600 dark:text-blue-400',
              purple: 'text-purple-600 dark:text-purple-400',
              green: 'text-green-600 dark:text-green-400',
              orange: 'text-orange-600 dark:text-orange-400',
            }
            return (
              <button
                key={index}
                onClick={() => setActiveView(action.view)}
                className={`p-6 rounded-xl border-2 transition-all text-left cursor-pointer ${colorClasses[action.color as keyof typeof colorClasses]}`}
              >
                <Icon className={`w-8 h-8 mb-3 ${iconColorClasses[action.color as keyof typeof iconColorClasses]}`} />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No recent activity. Start studying to see your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => {
              const Icon = activity.icon
              const getIconColor = () => {
                switch (activity.type) {
                  case 'material': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  case 'exam': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  case 'session': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              }
              const timeAgo = (() => {
                const now = new Date()
                const time = new Date(activity.time)
                const diffMs = now.getTime() - time.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const diffDays = Math.floor(diffHours / 24)
                if (diffMins < 60) return `${diffMins} minutes ago`
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
              })()
              return (
                <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className={`w-10 h-10 ${getIconColor()} rounded-full flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

