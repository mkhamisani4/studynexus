'use client'

import { useState, useEffect } from 'react'
import { Target, BookOpen, Sparkles, Plus, X, Loader2, FileText, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/NotificationContext'

interface Goal {
  id: string
  title: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  subject: string
  materialIds: string[]
}

export default function StudySchedule() {
  const { showSuccess, showError, showInfo } = useNotifications()
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState({ 
    title: '', 
    deadline: '', 
    priority: 'medium' as 'high' | 'medium' | 'low', 
    subject: '',
    materialIds: [] as string[]
  })
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [plan, setPlan] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([])
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  useEffect(() => {
    loadGoals()
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('study_materials')
        .select('id, title, subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvailableMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('study_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('schedule_date', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const scheduleData = data[0].schedule_data as any
        if (scheduleData?.goals) {
          // Normalize goals to ensure materialIds is always an array
          const normalizedGoals = scheduleData.goals.map((g: Goal) => ({
            ...g,
            materialIds: Array.isArray(g.materialIds) ? g.materialIds : []
          }))
          setGoals(normalizedGoals)
        }
        if (scheduleData?.plan) {
          setPlan(scheduleData.plan)
        }
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    }
  }

  const toggleMaterial = (materialId: string) => {
    if (newGoal.materialIds.includes(materialId)) {
      setNewGoal({
        ...newGoal,
        materialIds: newGoal.materialIds.filter(id => id !== materialId)
      })
    } else {
      setNewGoal({
        ...newGoal,
        materialIds: [...newGoal.materialIds, materialId]
      })
    }
  }

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.deadline || !newGoal.subject) {
      showError('Missing Information', 'Please fill in all required fields')
      return
    }

    if (newGoal.materialIds.length === 0) {
      showError('No Materials', 'Please select at least one document that supports this goal')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const goal: Goal = {
        id: Math.random().toString(36).substring(7),
        ...newGoal
      }
      const updatedGoals = [...goals, goal]
      setGoals(updatedGoals)

      await supabase.from('study_schedules').upsert({
        user_id: user.id,
        schedule_date: new Date().toISOString().split('T')[0],
        schedule_data: { goals: updatedGoals, plan: plan },
        energy_level: 7
      }, { onConflict: 'user_id,schedule_date' })

      setNewGoal({ title: '', deadline: '', priority: 'medium', subject: '', materialIds: [] })
      setShowAddGoal(false)
      showSuccess('Goal Added', 'Your study goal has been added!')
    } catch (error: any) {
      console.error('Error adding goal:', error)
      showError('Save Failed', 'Failed to save goal: ' + error.message)
    }
  }

  const removeGoal = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updatedGoals = goals.filter(g => g.id !== id)
      setGoals(updatedGoals)

      await supabase.from('study_schedules').upsert({
        user_id: user.id,
        schedule_date: new Date().toISOString().split('T')[0],
        schedule_data: { goals: updatedGoals, plan: plan },
        energy_level: 7
      }, { onConflict: 'user_id,schedule_date' })

      showSuccess('Goal Removed', 'The goal has been removed')
    } catch (error: any) {
      console.error('Error removing goal:', error)
      showError('Remove Failed', 'Failed to remove goal')
    }
  }

  const generatePlan = async () => {
    if (goals.length === 0) {
      showError('No Goals', 'Please add at least one study goal first!')
      return
    }

    // Check all goals have materials
    const goalsWithoutMaterials = goals.filter(g => !g.materialIds || !Array.isArray(g.materialIds) || g.materialIds.length === 0)
    if (goalsWithoutMaterials.length > 0) {
      showError('Missing Materials', 'Some goals are missing supporting documents. Please add materials to all goals.')
      return
    }

    setGenerating(true)
    showInfo('Generating Plan', 'Creating your personalized content-based study plan...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get full material details for selected materials
      const allMaterialIds = goals.flatMap(g => (g.materialIds && Array.isArray(g.materialIds)) ? g.materialIds : [])
      const { data: materialsData } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .in('id', allMaterialIds)

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.map(g => ({
            ...g,
            materials: materialsData?.filter(m => g.materialIds && Array.isArray(g.materialIds) && g.materialIds.includes(m.id)) || []
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to generate plan')

      const { plan: generatedPlan } = await response.json()
      setPlan(generatedPlan || [])

      await supabase.from('study_schedules').upsert({
        user_id: user.id,
        schedule_date: new Date().toISOString().split('T')[0],
        schedule_data: { goals, plan: generatedPlan },
        energy_level: 7
      }, { onConflict: 'user_id,schedule_date' })

      showSuccess('Plan Generated!', 'Your personalized content-based study plan is ready!')
    } catch (error: any) {
      console.error('Error generating plan:', error)
      showError('Generation Failed', error.message || 'Failed to generate study plan')
    } finally {
      setGenerating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'low': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  const getGoalMaterials = (goal: Goal) => {
    if (!goal.materialIds || !Array.isArray(goal.materialIds)) {
      return []
    }
    return availableMaterials.filter(m => goal.materialIds.includes(m.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Goals</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Set your goals, select supporting documents, and get a content-based study plan</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {showAddGoal && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Study Goal</h2>
            <button onClick={() => {
              setShowAddGoal(false)
              setNewGoal({ title: '', deadline: '', priority: 'medium', subject: '', materialIds: [] })
            }} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Title *</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Master Linear Algebra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                <input
                  type="text"
                  value={newGoal.subject}
                  onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline *</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supporting Documents * (Select documents that support this goal)
              </label>
              {availableMaterials.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No materials available. Upload some study materials first!</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                  <div className="space-y-2">
                    {availableMaterials.map((material) => (
                      <label
                        key={material.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newGoal.materialIds.includes(material.id)}
                          onChange={() => toggleMaterial(material.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{material.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{material.subject}</p>
                        </div>
                        {newGoal.materialIds.includes(material.id) && (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {newGoal.materialIds.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {newGoal.materialIds.length} document{newGoal.materialIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={addGoal}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Add Goal
            </button>
            <button
              onClick={() => {
                setShowAddGoal(false)
                setNewGoal({ title: '', deadline: '', priority: 'medium', subject: '', materialIds: [] })
              }}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Goals</h2>
              {goals.length > 0 && (
                <button
                  onClick={generatePlan}
                  disabled={generating}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Plan</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No goals set yet. Add your first study goal!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const goalMaterials = getGoalMaterials(goal)
                  return (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-lg border-2 ${getPriorityColor(goal.priority)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{goal.title}</h3>
                          <div className="flex items-center space-x-4 text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-300">{goal.subject}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          {goalMaterials.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Supporting Documents:</p>
                              <div className="flex flex-wrap gap-2">
                                {goalMaterials.map((material) => (
                                  <span
                                    key={material.id}
                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>{material.title}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="ml-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {plan.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Content-Based Study Plan</h2>
              <div className="space-y-4">
                {plan.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.order || idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.topic || item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                        )}
                        {item.material && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <BookOpen className="w-4 h-4" />
                            <span>From: {item.material}</span>
                          </div>
                        )}
                        {item.goal && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              Goal: {item.goal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
