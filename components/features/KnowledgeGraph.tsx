'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, RefreshCw, X, Loader2, HelpCircle, Sparkles, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'
import ReactMarkdown from 'react-markdown'

interface Word {
  word: string
  frequency: number
  category: string
  related_materials: string[]
}

interface Question {
  question: string
  type: string
  options?: string[]
  correct_answer: string
  explanation: string
}

export default function KnowledgeGraph() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [showAnswers, setShowAnswers] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const generateWordMap = async () => {
    if (materials.length === 0) {
      showError('No Materials', 'Please upload some study materials first!')
      return
    }

    setLoading(true)
    showInfo('Generating Word Map', 'Extracting key terms from your documents...')

    try {
      const response = await fetch('/api/word-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract',
          materials: materials.map(m => ({
            title: m.title,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to generate word map')

      const { words: extractedWords } = await response.json()
      setWords(extractedWords || [])
      showSuccess('Word Map Generated!', `Extracted ${extractedWords?.length || 0} key terms from your documents.`)
    } catch (error: any) {
      console.error('Error generating word map:', error)
      showError('Generation Failed', error.message || 'Failed to generate word map')
    } finally {
      setLoading(false)
    }
  }

  const handleWordClick = async (word: Word) => {
    setSelectedWord(word)
    setLoadingQuestions(true)
    setQuestions([])
    setShowAnswers(false)
    setUserAnswers({})
    setScore(null)

    try {
      const response = await fetch('/api/word-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-questions',
          word: word.word,
          materials: materials.map(m => ({
            title: m.title,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to generate questions')

      const { questions: generatedQuestions } = await response.json()
      setQuestions(generatedQuestions || [])
    } catch (error: any) {
      console.error('Error generating questions:', error)
      showError('Question Generation Failed', error.message || 'Failed to generate questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const toggleShowAnswers = () => {
    if (!showAnswers) {
      // Calculate score when showing answers
      let correct = 0
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct_answer) {
          correct++
        }
      })
      setScore({ correct, total: questions.length })
    }
    setShowAnswers(!showAnswers)
  }

  const isAnswerCorrect = (questionIndex: number) => {
    if (!showAnswers) return null
    return userAnswers[questionIndex] === questions[questionIndex].correct_answer
  }

  const getWordSize = (frequency: number) => {
    // Map frequency (1-100) to font size (12px - 48px)
    const minSize = 12
    const maxSize = 48
    return minSize + (frequency / 100) * (maxSize - minSize)
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concept':
        return 'bg-blue-500 dark:bg-blue-400'
      case 'term':
        return 'bg-purple-500 dark:bg-purple-400'
      case 'formula':
        return 'bg-green-500 dark:bg-green-400'
      case 'definition':
        return 'bg-orange-500 dark:bg-orange-400'
      default:
        return 'bg-gray-500 dark:bg-gray-400'
    }
  }

  const getCategoryTextColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concept':
        return 'text-blue-600 dark:text-blue-400'
      case 'term':
        return 'text-purple-600 dark:text-purple-400'
      case 'formula':
        return 'text-green-600 dark:text-green-400'
      case 'definition':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Simple word cloud layout - arrange words in a grid-like pattern with varying sizes
  const renderWordMap = () => {
    if (words.length === 0) return null

    // Sort words by frequency (largest first)
    const sortedWords = [...words].sort((a, b) => b.frequency - a.frequency)

    return (
      <div className="flex flex-wrap gap-3 p-6 justify-center items-center min-h-[400px]">
        {sortedWords.map((word, idx) => {
          const fontSize = getWordSize(word.frequency)
          const categoryColor = getCategoryColor(word.category)
          
          return (
            <button
              key={idx}
              onClick={() => handleWordClick(word)}
              className={`px-4 py-2 rounded-lg transition-all hover:scale-110 hover:shadow-lg ${categoryColor} text-white font-medium cursor-pointer`}
              style={{ fontSize: `${fontSize}px` }}
              title={`${word.word} (${word.category}) - Click to generate questions`}
            >
              {word.word}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Word Map</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Explore key terms from your documents and generate questions</p>
        </div>
        <button
          onClick={generateWordMap}
          disabled={loading || materials.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Generate Word Map</span>
            </>
          )}
        </button>
      </div>

      {materials.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Upload some study materials to generate a word map!</p>
        </div>
      )}

      {words.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-full overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded flex-shrink-0"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Concepts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 dark:bg-purple-400 rounded flex-shrink-0"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Terms</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 dark:bg-green-400 rounded flex-shrink-0"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Formulas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 dark:bg-orange-400 rounded flex-shrink-0"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Definitions</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              Click on any word to generate questions
            </p>
          </div>
          <div 
            ref={containerRef}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto bg-gray-50 dark:bg-gray-900 min-h-[400px] max-h-[600px]"
          >
            {renderWordMap()}
          </div>
        </div>
      )}

      {selectedWord && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Questions about: <span className={getCategoryTextColor(selectedWord.category)}>{selectedWord.word}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Category: {selectedWord.category} • Found in: {selectedWord.related_materials?.join(', ') || 'Multiple documents'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {questions.length > 0 && (
                <button
                  onClick={toggleShowAnswers}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  {showAnswers ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hide Answers</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Show Answers</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedWord(null)
                  setQuestions([])
                  setShowAnswers(false)
                  setUserAnswers({})
                  setScore(null)
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {score && showAnswers && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              score.correct === score.total 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : score.correct / score.total >= 0.7
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Your Score</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {score.correct} out of {score.total} correct ({Math.round((score.correct / score.total) * 100)}%)
                  </p>
                </div>
                <div className="text-3xl font-bold">
                  {score.correct === score.total ? (
                    <span className="text-green-600 dark:text-green-400">🎉</span>
                  ) : score.correct / score.total >= 0.7 ? (
                    <span className="text-yellow-600 dark:text-yellow-400">👍</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">📚</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {loadingQuestions ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Generating questions...</p>
              </div>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = userAnswers[idx]
                const isCorrect = isAnswerCorrect(idx)
                const hasAnswered = userAnswer !== undefined

                return (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        {q.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        {showAnswers && hasAnswered && (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">Question {idx + 1}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{q.question}</h3>
                    {q.options && q.options.length > 0 ? (
                      <div className="mb-3 space-y-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswer === option
                          const isCorrectOption = option === q.correct_answer
                          const showCorrect = showAnswers && isCorrectOption
                          const showIncorrect = showAnswers && isSelected && !isCorrectOption

                          return (
                            <button
                              key={optIdx}
                              onClick={() => !showAnswers && handleAnswerSelect(idx, option)}
                              disabled={showAnswers}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                showCorrect
                                  ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
                                  : showIncorrect
                                  ? 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
                                  : isSelected
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                              } ${!showAnswers ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                  {option}
                                </span>
                                {showCorrect && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                )}
                                {showIncorrect && (
                                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                )}
                                {isSelected && !showAnswers && (
                                  <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0"></div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <textarea
                          value={userAnswer || ''}
                          onChange={(e) => !showAnswers && handleAnswerSelect(idx, e.target.value)}
                          disabled={showAnswers}
                          placeholder="Type your answer here..."
                          rows={3}
                          className={`w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            showAnswers
                              ? isCorrect
                                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                          } ${!showAnswers ? 'cursor-text' : 'cursor-default'}`}
                        />
                      </div>
                    )}
                    {showAnswers && (
                      <>
                        <div className={`mt-3 p-3 rounded border ${
                          isCorrect
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm font-medium text-green-900 dark:text-green-200">Correct!</p>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <p className="text-sm font-medium text-red-900 dark:text-red-200">Incorrect</p>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            <span className="font-medium">Your answer:</span> {userAnswer || '(No answer provided)'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Correct answer:</span> {q.correct_answer}
                          </p>
                        </div>
                        {q.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Explanation:</p>
                            <div className="prose dark:prose-invert text-sm max-w-none">
                              <ReactMarkdown>{q.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {!showAnswers && hasAnswered && (
                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
                        Answer selected. Click "Show Answers" to check your response.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No questions generated yet. Click on a word to generate questions!</p>
            </div>
          )}
        </div>
      )}

      {words.length === 0 && materials.length > 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Click "Generate Word Map" to extract key terms from your documents</p>
        </div>
      )}
    </div>
  )
}
