'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Notification } from '@/components/Notification'
import NotificationContainer from '@/components/NotificationContainer'

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showInfo: (title: string, message: string) => void
  showWarning: (title: string, message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setNotifications((prev) => [...prev, { ...notification, id }])
  }, [])

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification({ type: 'success', title, message })
  }, [showNotification])

  const showError = useCallback((title: string, message: string) => {
    showNotification({ type: 'error', title, message })
  }, [showNotification])

  const showInfo = useCallback((title: string, message: string) => {
    showNotification({ type: 'info', title, message })
  }, [showNotification])

  const showWarning = useCallback((title: string, message: string) => {
    showNotification({ type: 'warning', title, message })
  }, [showNotification])

  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

