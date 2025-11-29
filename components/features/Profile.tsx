'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, BookOpen, Target, Brain, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    materialsCount: 0,
    conceptsCount: 0,
    examsCount: 0,
    studyHours: 0,
    averageScore: 0,
    studyStreak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      setUser(currentUser)

      const [materials, concepts, exams, sessions, profile] = await Promise.all([
        supabase.from('study_materials').select('id', { count: 'exact' }).eq('user_id', currentUser.id),
        supabase.from('concepts').select('id', { count: 'exact' }).eq('user_id', currentUser.id),
        supabase.from('exams').select('score').eq('user_id', currentUser.id).eq('completed', true),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', currentUser.id),
        supabase.from('learning_profiles').select('study_streak_days').eq('user_id', currentUser.id).single()
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
        materialsCount,
        conceptsCount,
        examsCount: examsData.length,
        studyHours: Math.round(totalHours * 10) / 10,
        averageScore: avgScore,
        studyStreak: profileData?.study_streak_days || 0
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccountAge = () => {
    if (!user?.created_at) return 'N/A'
    const created = new Date(user.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 30) return `${diffDays} days`
    const months = Math.floor(diffDays / 30)
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`
    const years = Math.floor(months / 12)
    return `${years} year${years > 1 ? 's' : ''}`
  }

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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Your account information and statistics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Account Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Username</p>
                <p className="text-sm text-slate-900 dark:text-slate-50">{user?.email?.split('@')[0] || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</p>
                <p className="text-sm text-slate-900 dark:text-slate-50">{user?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Member Since</p>
                <p className="text-sm text-slate-900 dark:text-slate-50">{getAccountAge()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.materialsCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Concepts</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.conceptsCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Exams</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.examsCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Score</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.averageScore}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Study Hours</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.studyHours}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Streak</p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.studyStreak} days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

