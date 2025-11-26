'use client'

import { useState } from 'react'
import { FileSearch, Book, FileText, Video, Globe, Sparkles, Loader2 } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'

export default function CitationFinder() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [content, setContent] = useState('')
  const [citations, setCitations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const findCitations = async () => {
    if (!content.trim()) {
      showError('Missing Content', 'Please enter content to analyze')
      return
    }

    setLoading(true)
    showInfo('Finding Citations', 'Analyzing your content and searching for relevant sources...')

    try {
      const response = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) throw new Error('Failed to find citations')

      const { sources } = await response.json()
      setCitations(sources || [])
      
      if (sources && sources.length > 0) {
        showSuccess('Citations Found!', `Found ${sources.length} relevant sources for your content.`)
      } else {
        showError('No Citations', 'No relevant citations found. Try providing more detailed content.')
      }
    } catch (error: any) {
      console.error('Error finding citations:', error)
      showError('Search Failed', error.message || 'Failed to find citations')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citation Finder</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered source discovery for your study materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Analyze Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content to Analyze
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your notes or content here. The AI will find relevant textbooks, research papers, videos, and websites..."
              />
            </div>
            <button
              onClick={findCitations}
              disabled={loading || !content.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Finding Citations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Find Citations</span>
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
              <p className="text-gray-500 dark:text-gray-400">Enter content to find relevant citations and sources</p>
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
