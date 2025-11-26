'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

interface NotificationProps {
  notification: Notification
  onClose: (id: string) => void
}

export default function Notification({ notification, onClose }: NotificationProps) {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(notification.id)
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.duration, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: Sparkles,
  }

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  }

  const Icon = icons[notification.type]

  return (
    <div
      className={`${colors[notification.type]} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

