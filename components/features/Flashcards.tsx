'use client'

import { useState, useEffect } from 'react'
import { Zap, RotateCw, CheckCircle, XCircle, Image as ImageIcon, Code, Loader2, Plus, CheckSquare, Square } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

export default function Flashcards() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]) // Array of material IDs
  const [showMaterialSelection, setShowMaterialSelection] = useState(false)

  useEffect(() => {
    loadFlashcards()
    loadMaterials()
  }, [])

  const loadFlashcards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error: any) {
      console.error('Error loading flashcards:', error)
    } finally {
      setLoading(false)
    }
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

  const generateFlashcards = async () => {
    if (materials.length === 0) {
      showError('No Materials', 'Please upload some study materials first!')
      return
    }

    if (selectedMaterials.length === 0) {
      showError('No Materials Selected', 'Please select at least one study material to generate flashcards from!')
      return
    }

    showInfo('Generating Flashcards', 'Creating flashcards from your selected materials...')
    setGenerating(true)
    setShowMaterialSelection(false)
    
    try {
      // Only use selected materials
      const selectedMaterialsData = materials.filter(m => selectedMaterials.includes(m.id))
      const materialsContent = selectedMaterialsData.map(m => `${m.title}\n\n${m.content}`).join('\n\n---\n\n')

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: materialsContent,
          numCards: 10
        })
      })

      if (!response.ok) throw new Error('Failed to generate flashcards')

      const { flashcards } = await response.json()

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const cardsToInsert = flashcards.map((card: any) => ({
        user_id: user.id,
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty || 'medium',
        mode: 'text',
        times_correct: 0,
        times_incorrect: 0
      }))

      const { data, error } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)
        .select()

      if (error) throw error

      setCards([...data, ...cards])
      showSuccess('Flashcards Generated!', `Created ${flashcards.length} flashcards from ${selectedMaterials.length} material(s)!`)
    } catch (error: any) {
      console.error('Error generating flashcards:', error)
      showError('Generation Failed', 'Failed to generate flashcards: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const flipCard = () => {
    setFlipped(!flipped)
    setShowAnswer(true)
  }

  const nextCard = async (correct: boolean) => {
    if (cards.length === 0) return

    const currentCardData = cards[currentCard]
    
    // Update in Supabase
    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          times_correct: correct ? currentCardData.times_correct + 1 : currentCardData.times_correct,
          times_incorrect: !correct ? currentCardData.times_incorrect + 1 : currentCardData.times_incorrect,
          last_reviewed: new Date().toISOString()
        })
        .eq('id', currentCardData.id)

      if (error) throw error

      // Update local state
      setCards(cards.map((c, i) => 
        i === currentCard ? {
          ...c,
          times_correct: correct ? c.times_correct + 1 : c.times_correct,
          times_incorrect: !correct ? c.times_incorrect + 1 : c.times_incorrect
        } : c
      ))
    } catch (error) {
      console.error('Error updating flashcard:', error)
    }

    setFlipped(false)
    setShowAnswer(false)
    setCurrentCard((currentCard + 1) % cards.length)
  }

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentCard(0)
    setFlipped(false)
    setShowAnswer(false)
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'image': return ImageIcon
      case 'code': return Code
      default: return Zap
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Practice with flashcards</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0 || showMaterialSelection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Practice with flashcards</p>
          </div>
          {!showMaterialSelection && (
            <button
              onClick={() => setShowMaterialSelection(true)}
              disabled={generating || materials.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>Generate Flashcards</span>
            </button>
          )}
        </div>

        {materials.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Upload study materials first to generate flashcards!
            </p>
          </div>
        )}

        {generating && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Creating flashcards from your selected materials...</p>
          </div>
        )}

        {!generating && materials.length > 0 && (
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
                Choose which materials to generate flashcards from ({selectedMaterials.length} of {materials.length} selected)
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
                  ⚠️ Please select at least one material to generate flashcards
                </p>
              </div>
            )}
            <div className="flex items-center space-x-4">
              {cards.length > 0 && (
                <button
                  onClick={() => setShowMaterialSelection(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={generateFlashcards}
                disabled={generating || selectedMaterials.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!showMaterialSelection && cards.length === 0 && !generating && materials.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <Zap className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">No flashcards available. Generate some from your study materials!</p>
          </div>
        )}
      </div>
    )
  }

  const card = cards[currentCard]
  const ModeIcon = getModeIcon(card.mode)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Practice with flashcards</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowMaterialSelection(true)}
            disabled={generating || materials.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate More</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Card {currentCard + 1} of {cards.length}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8 min-h-[400px] flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl dark:hover:shadow-2xl ${
            flipped ? 'border-blue-500 dark:border-blue-400' : ''
          }`}
          onClick={flipCard}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ModeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                card.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                card.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {card.difficulty}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {card.times_correct}✓ / {card.times_incorrect}✗
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {!showAnswer ? (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Question</h2>
                <p className="text-xl text-gray-700 dark:text-gray-300">{card.question}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Click to reveal answer</p>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Answer</h2>
                <p className="text-xl text-gray-700 dark:text-gray-300">{card.answer}</p>
              </div>
            )}
          </div>

          {showAnswer && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextCard(false)
                }}
                className="px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all flex items-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Incorrect</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextCard(true)
                }}
                className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Correct</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              setFlipped(false)
              setShowAnswer(false)
              setCurrentCard((currentCard - 1 + cards.length) % cards.length)
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => {
              setFlipped(false)
              setShowAnswer(false)
              setCurrentCard((currentCard + 1) % cards.length)
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Next
          </button>
          <button
            onClick={shuffleCards}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all flex items-center space-x-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  )
}
