'use client'

import { useState, useEffect } from 'react'
import { FileSearch, Book, FileText, Video, Globe, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

interface AdditionalResourcesProps {
  initialContent?: string
  materialTitle?: string
  initialMaterialId?: string
}

export default function AdditionalResources({ initialContent = '', materialTitle, initialMaterialId }: AdditionalResourcesProps) {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [citations, setCitations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userMaterials, setUserMaterials] = useState<any[]>([])
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])

  useEffect(() => {
    loadUserMaterials()
  }, [])

  // Auto-select note if initialMaterialId is provided, or if initialContent matches a material
  useEffect(() => {
    if (userMaterials.length > 0) {
      if (initialMaterialId && userMaterials.some(m => m.id === initialMaterialId)) {
        // Auto-select the specific material if ID is provided
        setSelectedNotes([initialMaterialId])
      } else if (initialContent && materialTitle) {
        // Find the material that matches the initial content or title
        const matchingMaterial = userMaterials.find(m => 
          m.id === initialMaterialId ||
          (m.content || '').trim() === initialContent.trim() ||
          m.title === materialTitle
        )
        if (matchingMaterial) {
          setSelectedNotes([matchingMaterial.id])
        } else {
          // If no exact match, select all by default
          setSelectedNotes(userMaterials.map(m => m.id))
        }
      } else if (selectedNotes.length === 0) {
        // Auto-select all notes by default if no initial content/material
        setSelectedNotes(userMaterials.map(m => m.id))
      }
    }
  }, [initialMaterialId, initialContent, userMaterials, materialTitle])

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

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const findResources = async () => {
    if (selectedNotes.length === 0) {
      showError('No Notes Selected', 'Please select at least one note to use for the search')
      return
    }

    setLoading(true)
    setCitations([])
    showInfo('Finding Resources', 'Analyzing your notes and searching for relevant sources...')

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

      // Combine all selected material content
      const combinedContent = selectedMaterials
        .map(m => `${m.title}\n\n${m.content}`)
        .join('\n\n---\n\n')

      const response = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: combinedContent })
      })

      if (!response.ok) throw new Error('Failed to find resources')

      const { sources } = await response.json()
      setCitations(sources || [])
      
      if (sources && sources.length > 0) {
        showSuccess('Resources Found!', `Found ${sources.length} relevant sources for your notes.`)
      } else {
        showError('No Resources', 'No relevant resources found. Try selecting different notes.')
      }
    } catch (error: any) {
      console.error('Error finding resources:', error)
      showError('Search Failed', error.message || 'Failed to find resources')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'textbook': return Book
      case 'paper': return FileText
      case 'video': return Video
      case 'website': return Globe
      default: return FileSearch
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'textbook': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'paper': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'website': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Additional Resources</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Select your notes to find relevant textbooks, papers, videos, and websites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Notes to Search</h2>
          <div className="space-y-4">
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
                <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
              onClick={findResources}
              disabled={loading || selectedNotes.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Finding Resources...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Find Resources</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Suggested Sources</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Searching for relevant sources...</p>
            </div>
          ) : citations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <FileSearch className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select notes and click "Find Resources" to discover relevant sources</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {citations.map((citation, idx) => {
                const Icon = getTypeIcon(citation.type)
                return (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(citation.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(citation.type)}`}>
                          {citation.type}
                        </span>
                      </div>
                      {citation.relevance_score && (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {citation.relevance_score}% relevant
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{citation.title}</h3>
                    {citation.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">by {citation.author}</p>
                    )}
                    {citation.url && (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Source</span>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
