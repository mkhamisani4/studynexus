'use client'

import { Notification } from './Notification'
import NotificationComponent from './Notification'

interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export default function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationComponent notification={notification} onClose={onRemove} />
        </div>
      ))}
    </div>
  )
}

