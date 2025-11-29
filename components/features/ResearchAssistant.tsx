'use client'

import { useState } from 'react'
import { Lightbulb, FileText, Sparkles, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ResearchAssistant() {
  const [paperContent, setPaperContent] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const analyzePaper = async () => {
    if (!paperContent.trim()) {
      alert('Please enter paper content to analyze')
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setAnalysis({
        summary: 'This paper presents a novel approach to machine learning optimization using gradient descent techniques. The authors propose a new algorithm that improves convergence rates by 30% compared to traditional methods.',
        key_contributions: [
          'Novel gradient descent algorithm with improved convergence',
          'Theoretical analysis of convergence rates',
          'Experimental validation on multiple datasets'
        ],
        contrasting_viewpoints: [
          'Some researchers argue that the computational overhead may not justify the gains',
          'Alternative approaches using second-order methods might be more efficient for certain problem types'
        ],
        potential_questions: [
          {
            question: 'What is the main contribution of this paper?',
            type: 'short_answer',
            answer: 'The main contribution is a novel gradient descent algorithm with improved convergence rates.'
          },
          {
            question: 'How does the proposed method compare to traditional approaches?',
            type: 'essay',
            answer: 'The proposed method shows 30% improvement in convergence rates while maintaining similar computational complexity.'
          }
        ]
      })
      setLoading(false)
    }, 2500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Research Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered research paper analysis and summarization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Input Research Paper</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paper Content
              </label>
              <textarea
                value={paperContent}
                onChange={(e) => setPaperContent(e.target.value)}
                rows={16}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste the research paper content here. The AI will analyze it and provide summaries, key contributions, contrasting viewpoints, and potential exam questions..."
              />
            </div>
            <button
              onClick={analyzePaper}
              disabled={loading || !paperContent.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Analyze Paper'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h2>
          {analysis ? (
            <div className="space-y-6 max-h-[700px] overflow-y-auto">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Summary</span>
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{analysis.summary}</ReactMarkdown>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span>Key Contributions</span>
                </h3>
                <ul className="space-y-2">
                  {analysis.key_contributions.map((contribution: string, idx: number) => (
                    <li key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-start space-x-2">
                      <span className="font-bold text-green-600 dark:text-green-400">{idx + 1}.</span>
                      <span className="text-gray-700 dark:text-gray-300">{contribution}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span>Contrasting Viewpoints</span>
                </h3>
                <ul className="space-y-2">
                  {analysis.contrasting_viewpoints.map((viewpoint: string, idx: number) => (
                    <li key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <span className="text-gray-700 dark:text-gray-300">{viewpoint}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Potential Exam Questions</h3>
                <div className="space-y-3">
                  {analysis.potential_questions.map((q: any, idx: number) => (
                    <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300 capitalize">{q.type}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Question {idx + 1}</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">{q.question}</p>
                      <div className="p-2 bg-white dark:bg-gray-700 rounded border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{q.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center">
              <Lightbulb className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Enter research paper content to get AI-powered analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

