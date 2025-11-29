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

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

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

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950">
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
