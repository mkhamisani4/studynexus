'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Sparkles, Loader2, BookOpen, FileText, CheckCircle2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

export default function ExplainConcepts() {
  const { showSuccess, showError } = useNotifications()
  const [question, setQuestion] = useState('')
  const [explanation, setExplanation] = useState('')
  const [usedNotes, setUsedNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [userMaterials, setUserMaterials] = useState<any[]>([])
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])

  useEffect(() => {
    loadUserMaterials()
  }, [])

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
      // Auto-select all notes by default
      if (data && data.length > 0) {
        setSelectedNotes(data.map(m => m.id))
      }
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const generateExplanation = async () => {
    if (!question.trim()) {
      showError('Missing Question', 'Please enter what you want explained')
      return
    }

    if (selectedNotes.length === 0) {
      showError('No Notes Selected', 'Please select at least one note to use for the explanation')
      return
    }

    setLoading(true)
    setExplanation('')
    setUsedNotes([])
    
    try {
      // Get selected materials
      const selectedMaterials = userMaterials
        .filter(m => selectedNotes.includes(m.id))
        .map(m => ({
          id: m.id,
          title: m.title,
          content: m.content || '',
          subject: m.subject
        }))

      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userMaterials: selectedMaterials
        })
      })

      if (!response.ok) throw new Error('Failed to generate explanation')

      const { explanation: generatedExplanation, usedNoteIds } = await response.json()
      setExplanation(generatedExplanation)
      setUsedNotes(usedNoteIds || [])
      showSuccess('Explanation Generated', 'Your explanation based on your notes is ready!')
    } catch (error: any) {
      console.error('Error generating explanation:', error)
      showError('Generation Failed', error.message || 'Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Explain Concepts</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Ask questions and get explanations based on your notes</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-50">Ask Your Question</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                What would you like explained?
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
                placeholder="Ask in your own words... e.g., 'Explain how photosynthesis works like I'm 5', 'What's the difference between recursion and iteration?', 'Help me understand derivatives in simple terms'"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Ask naturally - the AI will adapt to your style and use your notes to explain
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Notes to Use ({selectedNotes.length} selected)
              </label>
              {userMaterials.length === 0 ? (
                <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notes available. Upload notes in Study Materials first.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {userMaterials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => toggleNoteSelection(material.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedNotes.includes(material.id)
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            selectedNotes.includes(material.id)
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{material.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{material.subject}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={generateExplanation}
              disabled={loading || !question.trim() || selectedNotes.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Explain Using My Notes</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Explanation</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Analyzing your notes and generating explanation...</p>
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              {usedNotes.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Based on Your Notes</h3>
                  </div>
                  <div className="space-y-1">
                    {usedNotes.map((noteId) => {
                      const note = userMaterials.find(m => m.id === noteId)
                      return note ? (
                        <div key={noteId} className="text-sm text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>{note.title}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-headings:mt-6 prose-headings:mb-3 prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Ask a question and select your notes to get an explanation</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
