'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BookOpen, Target, Calendar, Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

export default function Progress() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    studyHours: 0,
    averageScore: 0,
    materials: 0,
    concepts: 0
  })
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [subjectProgress, setSubjectProgress] = useState<any[]>([])

  useEffect(() => {
    loadProgressData()
  }, [timeRange])

  const loadProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setLoading(true)

      // Calculate date range
      const now = new Date()
      const startDate = new Date()
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1)
      } else {
        startDate.setFullYear(now.getFullYear() - 1)
      }

      // Load all data in parallel
      const [sessions, exams, materials, concepts] = await Promise.all([
        supabase.from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('exams')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('created_at', startDate.toISOString()),
        supabase.from('study_materials')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase.from('concepts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
      ])

      const sessionsData = sessions.data || []
      const examsData = exams.data || []
      const materialsCount = materials.count || 0
      const conceptsCount = concepts.count || 0

      // Calculate stats
      const totalHours = sessionsData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
      const avgScore = examsData.length > 0
        ? Math.round(examsData.reduce((sum, e) => sum + (e.score || 0), 0) / examsData.length)
        : 0

      setStats({
        studyHours: Math.round(totalHours * 10) / 10,
        averageScore: avgScore,
        materials: materialsCount,
        concepts: conceptsCount
      })

      // Generate weekly data for charts
      if (timeRange === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekData = days.map((day, idx) => {
          const dayDate = new Date(now)
          dayDate.setDate(now.getDate() - (6 - idx))
          const dayStart = new Date(dayDate.setHours(0, 0, 0, 0))
          const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999))

          const daySessions = sessionsData.filter((s: any) => {
            const sessionDate = new Date(s.created_at)
            return sessionDate >= dayStart && sessionDate <= dayEnd
          })

          const dayExams = examsData.filter((e: any) => {
            const examDate = new Date(e.created_at)
            return examDate >= dayStart && examDate <= dayEnd
          })

          const hours = daySessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / 60
          const score = dayExams.length > 0
            ? Math.round(dayExams.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / dayExams.length)
            : 0

          return { day, hours: Math.round(hours * 10) / 10, score }
        })
        setWeeklyData(weekData)
      } else {
        // For month/year, group by week
        const weeks: any[] = []
        let currentWeek = new Date(startDate)
        while (currentWeek <= now) {
          const weekEnd = new Date(currentWeek)
          weekEnd.setDate(currentWeek.getDate() + 6)

          const weekSessions = sessionsData.filter((s: any) => {
            const sessionDate = new Date(s.created_at)
            return sessionDate >= currentWeek && sessionDate <= weekEnd
          })

          const weekExams = examsData.filter((e: any) => {
            const examDate = new Date(e.created_at)
            return examDate >= currentWeek && examDate <= weekEnd
          })

          const hours = weekSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / 60
          const score = weekExams.length > 0
            ? Math.round(weekExams.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / weekExams.length)
            : 0

          weeks.push({
            day: `Week ${weeks.length + 1}`,
            hours: Math.round(hours * 10) / 10,
            score
          })

          currentWeek.setDate(currentWeek.getDate() + 7)
        }
        setWeeklyData(weeks)
      }

      // Generate subject progress
      const { data: materialsBySubject } = await supabase
        .from('study_materials')
        .select('subject')
        .eq('user_id', user.id)

      const { data: conceptsBySubject } = await supabase
        .from('concepts')
        .select('subject, mastery_level')
        .eq('user_id', user.id)

      const subjectMap = new Map<string, { hours: number; mastery: number; count: number }>()

      // Calculate hours per subject from sessions
      sessionsData.forEach((s: any) => {
        const subject = s.subject || 'General'
        const current = subjectMap.get(subject) || { hours: 0, mastery: 0, count: 0 }
        current.hours += (s.duration_minutes || 0) / 60
        subjectMap.set(subject, current)
      })

      // Calculate mastery per subject
      if (conceptsBySubject) {
        conceptsBySubject.forEach((c: any) => {
          const subject = c.subject || 'General'
          const current = subjectMap.get(subject) || { hours: 0, mastery: 0, count: 0 }
          current.mastery += c.mastery_level || 0
          current.count += 1
          subjectMap.set(subject, current)
        })
      }

      const subjectData = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        mastery: data.count > 0 ? Math.round(data.mastery / data.count) : 0,
        hours: Math.round(data.hours * 10) / 10
      })).sort((a, b) => b.hours - a.hours).slice(0, 5)

      setSubjectProgress(subjectData)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor your learning journey and performance</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor your learning journey and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Study Hours</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.studyHours}h</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.averageScore}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Materials</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.materials}</p>
            </div>
            <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Concepts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.concepts}</p>
            </div>
            <Target className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Study Hours & Performance</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#3b82f6" name="Hours" />
                <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" name="Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500 dark:text-gray-400">No data available for this time range</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subject Mastery</h2>
          {subjectProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="mastery" fill="#8b5cf6" name="Mastery %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500 dark:text-gray-400">No subject data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subject Breakdown</h2>
        {subjectProgress.length > 0 ? (
          <div className="space-y-4">
            {subjectProgress.map((subject, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{subject.subject}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{subject.mastery}% mastery • {subject.hours}h studied</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      subject.mastery >= 80 ? 'bg-green-500 dark:bg-green-400' :
                      subject.mastery >= 60 ? 'bg-yellow-500 dark:bg-yellow-400' :
                      'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{ width: `${subject.mastery}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No subject progress data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
