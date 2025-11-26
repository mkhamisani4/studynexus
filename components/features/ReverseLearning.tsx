'use client'

import { useState } from 'react'
import { Target, BookOpen, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNotifications } from '@/contexts/NotificationContext'

export default function ReverseLearning() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [problem, setProblem] = useState('')
  const [subject, setSubject] = useState('')
  const [learningPath, setLearningPath] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  const generatePath = async () => {
    if (!problem.trim() || !subject.trim()) {
      showError('Missing Information', 'Please enter both a problem and subject')
      return
    }

    setGenerating(true)
    showInfo('Generating Path', 'Creating your personalized learning path...')

    try {
      const response = await fetch('/api/reverse-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          subject
        })
      })

      if (!response.ok) throw new Error('Failed to generate learning path')

      const path = await response.json()
      setLearningPath(path)
      showSuccess('Path Generated!', 'Your reverse learning path is ready!')
    } catch (error: any) {
      console.error('Error generating path:', error)
      showError('Generation Failed', error.message || 'Failed to generate learning path')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reverse Learning Mode</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Start with a problem and learn all prerequisite concepts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Input Problem</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem or Question
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Solve the longest common subsequence problem using dynamic programming"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Algorithms, Mathematics, Computer Science"
              />
            </div>
            <button
              onClick={generatePath}
              disabled={generating || !problem.trim() || !subject.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Learning Path...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Learning Path</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Learning Path</h2>
          {generating ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Generating your personalized learning path...</p>
            </div>
          ) : learningPath ? (
            <div className="space-y-6">
              {learningPath.concepts && learningPath.concepts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Prerequisite Concepts</span>
                  </h3>
                  <div className="space-y-3">
                    {learningPath.concepts.map((concept: any, idx: number) => (
                      <div key={idx}>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {concept.order || idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{concept.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{concept.description}</p>
                            </div>
                          </div>
                        </div>
                        {idx < learningPath.concepts.length - 1 && (
                          <div className="flex justify-center my-2">
                            <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {learningPath.materials && learningPath.materials.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>Study Materials</span>
                  </h3>
                  <div className="space-y-3">
                    {learningPath.materials.map((material: any, idx: number) => (
                      <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-600 dark:bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {material.order || idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{material.title}</h4>
                            <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <ReactMarkdown>{material.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Enter a problem to generate a reverse learning path</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
