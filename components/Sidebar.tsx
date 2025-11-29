'use client'

import {
  LayoutDashboard,
  FileText,
  Brain,
  GraduationCap,
  HelpCircle,
  Calendar,
  Target,
  BookOpen,
  Zap,
  TrendingUp,
  FileSearch,
  Lightbulb
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
]

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

