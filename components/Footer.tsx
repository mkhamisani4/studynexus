'use client'

import {
  LayoutDashboard,
  FileText,
  Brain,
  GraduationCap,
  HelpCircle,
  Calendar,
  Target,
  Zap,
  TrendingUp,
  FileSearch,
  Lightbulb,
  Info,
  User
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'materials', label: 'Study Materials', icon: FileText },
  { id: 'knowledge-graph', label: 'Word Map', icon: Brain },
  { id: 'exam-mode', label: 'Exam Mode', icon: GraduationCap },
  { id: 'flashcards', label: 'Flashcards', icon: Zap },
  { id: 'explain', label: 'Explain Concepts', icon: HelpCircle },
  { id: 'schedule', label: 'Study Goals', icon: Calendar },
  { id: 'reverse-learning', label: 'Reverse Learning', icon: Target },
  { id: 'research', label: 'Research Assistant', icon: Lightbulb },
  { id: 'citations', label: 'Additional Resources', icon: FileSearch },
  { id: 'about', label: 'About', icon: Info },
  { id: 'profile', label: 'Profile', icon: User },
]

interface FooterProps {
  setActiveView?: (view: string) => void
}

export default function Footer({ setActiveView }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950">
      <div className="mx-auto max-w-[1920px] px-6 py-6">
        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              if (setActiveView) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              }
              return (
                <div key={item.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} StudyNexus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
