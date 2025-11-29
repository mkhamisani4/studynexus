'use client'

import { BookOpen, Brain, GraduationCap, Zap, Target, Calendar } from 'lucide-react'

export default function About() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">About StudyNexus</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Learn more about our platform</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Our Mission</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            StudyNexus is designed to help students study smarter, not harder. We provide tools that transform 
            your study materials into an interactive learning experience, making it easier to understand concepts, practice 
            with exams, and track your progress.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Key Features</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Study Materials</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Organize and manage all your notes in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Word Map</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Visualize concepts and terms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Exam Mode</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Practice with AI-generated exams</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Flashcards</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Interactive flashcards for active learning</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Study Goals</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Set and track your learning objectives</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-950/20">
                <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Progress Tracking</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Monitor your learning journey</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">How It Works</h2>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>1. Upload your study materials (notes, PDFs, documents)</p>
            <p>2. Use our tools to generate exams, flashcards, and explanations</p>
            <p>3. Track your progress and identify areas for improvement</p>
            <p>4. Study smarter with personalized learning paths</p>
          </div>
        </div>
      </div>
    </div>
  )
}

