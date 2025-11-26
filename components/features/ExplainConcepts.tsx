'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Sparkles, Loader2, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

export default function ExplainConcepts() {
  const { showSuccess, showError } = useNotifications()
  const [concept, setConcept] = useState('')
  const [context, setContext] = useState('')
  const [level, setLevel] = useState<'eli5' | 'beginner' | 'standard' | 'graduate' | 'professor'>('standard')
  const [explanation, setExplanation] = useState('')
  const [sourceBreakdown, setSourceBreakdown] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [recentConcepts, setRecentConcepts] = useState<any[]>([])
  const [userMaterials, setUserMaterials] = useState<any[]>([])

  useEffect(() => {
    loadRecentConcepts()
    loadUserMaterials()
  }, [])

  const loadRecentConcepts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('concepts')
        .select('name, subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentConcepts(data || [])
    } catch (error) {
      console.error('Error loading concepts:', error)
    }
  }

  const loadUserMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('study_materials')
        .select('id, title, content, subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const levels = [
    { value: 'eli5', label: 'ELI5 (Like I\'m 5)', description: 'Simple, child-friendly explanations' },
    { value: 'beginner', label: 'Beginner', description: 'For those just starting out' },
    { value: 'standard', label: 'Standard Student', description: 'Typical student level' },
    { value: 'graduate', label: 'Graduate Level', description: 'Advanced understanding' },
    { value: 'professor', label: 'Professor Level', description: 'Deep technical expertise' },
  ]

  const generateExplanation = async () => {
    if (!concept.trim()) {
      showError('Missing Concept', 'Please enter a concept to explain')
      return
    }

    setLoading(true)
    setExplanation('')
    setSourceBreakdown('')
    
    try {
      // Get user's weak concepts for context
      const { data: { user } } = await supabase.auth.getUser()
      let userContext = context

      if (user && !context) {
        const { data: weakConcepts } = await supabase
          .from('concepts')
          .select('name')
          .eq('user_id', user.id)
          .lt('mastery_level', 60)
          .limit(5)

        if (weakConcepts && weakConcepts.length > 0) {
          userContext = `User's weak areas: ${weakConcepts.map(c => c.name).join(', ')}`
        }
      }

      // Prepare user materials for the API
      const materialsData = userMaterials.map(m => ({
        title: m.title,
        content: m.content,
        subject: m.subject
      }))

      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          context: userContext || context,
          level,
          userMaterials: materialsData
        })
      })

      if (!response.ok) throw new Error('Failed to generate explanation')

      const { explanation: generatedExplanation, sourceBreakdown: breakdown } = await response.json()
      setExplanation(generatedExplanation)
      setSourceBreakdown(breakdown || '')
      showSuccess('Explanation Generated', 'Your personalized explanation is ready!')
    } catch (error: any) {
      console.error('Error generating explanation:', error)
      showError('Generation Failed', error.message || 'Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  const selectConcept = (conceptName: string) => {
    setConcept(conceptName)
    loadRecentConcepts()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explain Concepts</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Get personalized explanations at different complexity levels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Input</h2>
          <div className="space-y-4">
            {recentConcepts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recent Concepts
                </label>
                <div className="flex flex-wrap gap-2">
                  {recentConcepts.slice(0, 5).map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectConcept(c.name)}
                      className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Concept to Explain
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Recursion, Photosynthesis, Derivatives..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide additional context about what you're studying..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation Level
              </label>
              <div className="space-y-2">
                {levels.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value as any)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      level === l.value
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{l.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{l.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={generateExplanation}
              disabled={loading || !concept.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Explanation</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Explanation</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Generating explanation...</p>
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              {sourceBreakdown && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Source Information</h3>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{sourceBreakdown}</p>
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Enter a concept and click "Generate Explanation" to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Just In Time Help</h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          While studying any material, you can click the "I'm stuck" button to get instant, personalized explanations
          based on what you're currently reading and your learning history.
        </p>
      </div>
    </div>
  )
}
