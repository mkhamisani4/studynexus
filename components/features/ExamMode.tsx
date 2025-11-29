'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GraduationCap, Play, Clock, CheckCircle, XCircle, Loader2, CheckSquare, Square } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

export default function ExamMode() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [exam, setExam] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [takingExam, setTakingExam] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]) // Array of material IDs
  const [duration, setDuration] = useState(60)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // in seconds
  const [examStartTime, setExamStartTime] = useState<Date | null>(null)
  const finishingRef = useRef(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const finishExam = useCallback(async () => {
    if (completed || finishingRef.current) return // Prevent multiple submissions
    
    finishingRef.current = true
    setCompleted(true)
    setTakingExam(false)
    
    let totalScore = 0
    let maxScore = 0
    exam.questions.forEach((q: any) => {
      maxScore += q.points || 10
      if (answers[q.id]?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) {
        totalScore += q.points || 10
      }
    })
    const finalScore = Math.round((totalScore / maxScore) * 100)
    setScore(finalScore)

    // Show notification if time ran out
    if (timeRemaining === 0) {
      showInfo('Time Up!', 'Your exam has been automatically submitted.')
    } else {
      showSuccess('Exam Submitted', `Your score: ${finalScore}%`)
    }

    // Save exam results to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && exam) {
        await supabase
          .from('exams')
          .update({
            completed: true,
            score: finalScore,
            answers: answers,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    } catch (error) {
      console.error('Error saving exam results:', error)
    }
  }, [exam, answers, completed, timeRemaining, showInfo, showSuccess])

  // Timer effect
  useEffect(() => {
    if (!takingExam || !exam || completed) {
      return
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(timer)
          // Auto-submit when time runs out
          finishExam()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [takingExam, exam, completed, finishExam])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
      // Select all materials by default
      if (data && data.length > 0) {
        setSelectedMaterials(data.map(m => m.id))
      }
    } catch (error: any) {
      console.error('Error loading materials:', error)
    }
  }

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  const selectAllMaterials = () => {
    setSelectedMaterials(materials.map(m => m.id))
  }

  const deselectAllMaterials = () => {
    setSelectedMaterials([])
  }

  const generateExam = async () => {
    if (materials.length === 0) {
      showError('No Materials', 'Please upload some study materials first!')
      return
    }

    if (selectedMaterials.length === 0) {
      showError('No Materials Selected', 'Please select at least one study material to include in the exam!')
      return
    }

    showInfo('Generating Exam', 'Analyzing your selected materials and creating questions...')

    setGenerating(true)
    try {
      // Only use selected materials
      const selectedMaterialsData = materials.filter(m => selectedMaterials.includes(m.id))
      const materialsContent = selectedMaterialsData.map(m => `${m.title}\n\n${m.content}`).join('\n\n---\n\n')

      const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: [materialsContent],
          duration,
          difficulty
        })
      })

      if (!response.ok) throw new Error('Failed to generate exam')

      const examData = await response.json()
      
      // Add IDs to questions
      const questionsWithIds = examData.questions.map((q: any, idx: number) => ({
        ...q,
        id: `q${idx + 1}`
      }))

      const newExam = {
        id: Date.now().toString(),
        subject: selectedMaterialsData[0]?.subject || 'General',
        duration_minutes: duration,
        predicted_difficulty: examData.predicted_difficulty || difficulty,
        questions: questionsWithIds,
        selectedMaterials: selectedMaterials // Store selected materials for reference
      }

      setExam(newExam)

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('exams').insert({
          user_id: user.id,
          subject: newExam.subject,
          duration_minutes: duration,
          questions: questionsWithIds,
          predicted_difficulty: difficulty,
          completed: false
        })
      }

      showSuccess('Exam Generated!', `Your ${duration}-minute ${difficulty} exam is ready with ${questionsWithIds.length} questions from ${selectedMaterials.length} material(s).`)
    } catch (error: any) {
      console.error('Error generating exam:', error)
      showError('Generation Failed', 'Failed to generate exam: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const startExam = () => {
    finishingRef.current = false
    setTakingExam(true)
    setCurrentQuestion(0)
    setAnswers({})
    setCompleted(false)
    setScore(null)
    setTimeRemaining(exam.duration_minutes * 60)
    setExamStartTime(new Date())
    
    // Save exam start time to Supabase
    const saveStartTime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && exam) {
          await supabase
            .from('exams')
            .update({
              started_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
        }
      } catch (error) {
        console.error('Error saving exam start time:', error)
      }
    }
    saveStartTime()
  }

  const submitAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const nextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      finishExam()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exam Mode</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Practice exams based on your study materials</p>
        </div>
        {!exam && (
          <div className="flex items-center space-x-4">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={120}>120 min</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={generateExam}
              disabled={generating || materials.length === 0 || selectedMaterials.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-5 h-5" />
                  <span>Generate Exam</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {materials.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⚠️ Upload study materials first to generate exams!
          </p>
        </div>
      )}

      {!exam && !generating && materials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Study Materials</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllMaterials}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllMaterials}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose which materials to include in your exam ({selectedMaterials.length} of {materials.length} selected)
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {materials.map((material) => {
                const isSelected = selectedMaterials.includes(material.id)
                return (
                  <button
                    key={material.id}
                    onClick={() => toggleMaterialSelection(material.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{material.title || 'Untitled Material'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {material.content?.substring(0, 100)}...
                        </p>
                        {material.subject && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                            {material.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          {selectedMaterials.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Please select at least one material to generate an exam
              </p>
            </div>
          )}
        </div>
      )}

      {generating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Loader2 className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Analyzing your materials and generating exam questions...</p>
        </div>
      )}

      {exam && !takingExam && !completed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.subject} Exam</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{exam.duration_minutes} minutes</span>
                </div>
                <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                  {exam.predicted_difficulty}
                </div>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Exam Overview</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• {exam.questions.length} questions</li>
              <li>• Mix of multiple choice, short answer, and essay questions</li>
              <li>• Based on {exam.selectedMaterials?.length || 'your selected'} study material(s)</li>
              <li>• Predicted difficulty: {exam.predicted_difficulty}</li>
            </ul>
          </div>
          <button
            onClick={startExam}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Exam</span>
          </button>
        </div>
      )}

      {takingExam && exam && !completed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Question {currentQuestion + 1} of {exam.questions.length}
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono font-semibold ${
              timeRemaining <= 300 // 5 minutes
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : timeRemaining <= 600 // 10 minutes
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              <Clock className={`w-4 h-4 ${
                timeRemaining <= 300 ? 'animate-pulse' : ''
              }`} />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>
          {timeRemaining <= 300 && timeRemaining > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ⚠️ Less than 5 minutes remaining! The exam will auto-submit when time runs out.
              </p>
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {exam.questions[currentQuestion].question}
            </h3>
            {exam.questions[currentQuestion].type === 'multiple_choice' ? (
              <div className="space-y-3">
                {exam.questions[currentQuestion].options?.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => submitAnswer(exam.questions[currentQuestion].id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[exam.questions[currentQuestion].id] === option
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[exam.questions[currentQuestion].id] || ''}
                onChange={(e) => submitAnswer(exam.questions[currentQuestion].id, e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer here..."
              />
            )}
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={nextQuestion}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {currentQuestion === exam.questions.length - 1 ? 'Finish Exam' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {completed && score !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            score >= 80 ? 'bg-green-100 dark:bg-green-900/30' : score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {score >= 80 ? (
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exam Complete!</h2>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">{score}%</p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {score >= 80
              ? 'Excellent work! You have a strong understanding of the material.'
              : score >= 60
              ? 'Good effort! Review the areas you missed.'
              : 'Keep studying! Focus on the weak areas identified.'}
          </p>
          <button
            onClick={() => {
              setExam(null)
              setTakingExam(false)
              setCompleted(false)
              setScore(null)
              setTimeRemaining(0)
              setExamStartTime(null)
              setAnswers({})
              setCurrentQuestion(0)
              // Reset to all materials selected
              setSelectedMaterials(materials.map(m => m.id))
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Generate New Exam
          </button>
        </div>
      )}
    </div>
  )
}
