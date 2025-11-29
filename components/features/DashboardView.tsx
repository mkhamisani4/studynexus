'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BookOpen, Target, Zap, Calendar, Brain, Loader2, ArrowRight } from 'lucide-react'
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

      const [recentMaterials, recentExams, recentSessions] = await Promise.all([
        supabase.from('study_materials').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('exams').select('id, subject, score, created_at').eq('user_id', user.id).eq('completed', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('study_sessions').select('id, subject, duration_minutes, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      ])

      const activities: any[] = []
      
      recentMaterials.data?.forEach((m: any) => {
        activities.push({
          type: 'material',
          title: m.title,
          subtitle: 'Uploaded',
          time: m.created_at,
          icon: BookOpen
        })
      })

      recentExams.data?.forEach((e: any) => {
        activities.push({
          type: 'exam',
          title: `${e.subject} Exam`,
          subtitle: `Score: ${e.score}%`,
          time: e.created_at,
          icon: Target
        })
      })

      recentSessions.data?.forEach((s: any) => {
        activities.push({
          type: 'session',
          title: s.subject,
          subtitle: `${s.duration_minutes} minutes`,
          time: s.created_at,
          icon: Calendar
        })
      })

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activities.slice(0, 6))
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { title: 'Upload Notes', description: 'Add new study materials', icon: BookOpen, view: 'materials', color: 'blue' },
    { title: 'Take Exam', description: 'Practice with custom exams', icon: Target, view: 'exam-mode', color: 'purple' },
    { title: 'Flashcards', description: 'Review with flashcards', icon: Zap, view: 'flashcards', color: 'amber' },
    { title: 'Word Map', description: 'Explore concepts', icon: Brain, view: 'knowledge-graph', color: 'emerald' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  const getIconColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      amber: 'text-amber-600 dark:text-amber-400',
      emerald: 'text-emerald-600 dark:text-emerald-400',
      orange: 'text-orange-600 dark:text-orange-400',
      indigo: 'text-indigo-600 dark:text-indigo-400',
      pink: 'text-pink-600 dark:text-pink-400',
    }
    return colors[color] || 'text-slate-600 dark:text-slate-400'
  }

  const getBgColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-950/20',
      purple: 'bg-purple-50 dark:bg-purple-950/20',
      amber: 'bg-amber-50 dark:bg-amber-950/20',
      emerald: 'bg-emerald-50 dark:bg-emerald-950/20',
      orange: 'bg-orange-50 dark:bg-orange-950/20',
      indigo: 'bg-indigo-50 dark:bg-indigo-950/20',
      pink: 'bg-pink-50 dark:bg-pink-950/20',
    }
    return colors[color] || 'bg-slate-100 dark:bg-slate-800'
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Overview of your study progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Study Streak</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.studyStreak}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">days</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('orange')}`}>
              <TrendingUp className={`h-5 w-5 ${getIconColor('orange')}`} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Materials</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.materialsUploaded}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">uploaded</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('blue')}`}>
              <BookOpen className={`h-5 w-5 ${getIconColor('blue')}`} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Concepts</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.conceptsMastered}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">mastered</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('emerald')}`}>
              <Brain className={`h-5 w-5 ${getIconColor('emerald')}`} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Exams</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.examsCompleted}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">completed</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('purple')}`}>
              <Target className={`h-5 w-5 ${getIconColor('purple')}`} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Average Score</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.averageScore}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">across all exams</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('indigo')}`}>
              <TrendingUp className={`h-5 w-5 ${getIconColor('indigo')}`} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Study Hours</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.studyHours}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">total hours</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor('pink')}`}>
              <Calendar className={`h-5 w-5 ${getIconColor('pink')}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Quick Actions</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Get started with common tasks</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => setActiveView(action.view)}
                className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${getBgColor(action.color)}`}>
                  <Icon className={`h-4 w-4 ${getIconColor(action.color)}`} />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">{action.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Your latest study sessions and progress</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity, idx) => {
              const Icon = activity.icon
              const getActivityColor = () => {
                switch (activity.type) {
                  case 'material': return { icon: 'blue', bg: 'blue' }
                  case 'exam': return { icon: 'purple', bg: 'purple' }
                  case 'session': return { icon: 'emerald', bg: 'emerald' }
                  default: return { icon: 'slate', bg: 'slate' }
                }
              }
              const colors = getActivityColor()
              const timeAgo = (() => {
                const now = new Date()
                const time = new Date(activity.time)
                const diffMs = now.getTime() - time.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const diffDays = Math.floor(diffHours / 24)
                if (diffMins < 60) return `${diffMins}m ago`
                if (diffHours < 24) return `${diffHours}h ago`
                return `${diffDays}d ago`
              })()
              return (
                <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg !== 'slate' ? getBgColor(colors.bg) : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className={`h-4 w-4 ${colors.icon !== 'slate' ? getIconColor(colors.icon) : 'text-slate-600 dark:text-slate-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{activity.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{activity.subtitle}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-500">{timeAgo}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
