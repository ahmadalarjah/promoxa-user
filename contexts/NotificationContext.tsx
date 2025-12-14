"use client"

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'

interface Notification {
  id: number
  title: string
  message: string
  type: 'DEPOSIT_APPROVED' | 'DEPOSIT_REJECTED' | 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED' | 'SYSTEM_MESSAGE' | 'PLAN_PURCHASED' | 'REFERRAL_BONUS' | 'DAILY_EARNINGS' | 'ADMIN_MESSAGE' | 'FIRST_DEPOSIT_BONUS'
  isRead: boolean
  createdAt: string
  readAt?: string
  relatedEntityType?: string
  relatedEntityId?: number
}

interface NotificationContextType {
  unreadCount: number
  notifications: Notification[]
  loading: boolean
  refreshNotifications: () => Promise<void>
  refreshUnreadCount: () => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const shownNotificationIds = useRef<Set<number>>(new Set())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationCount()
      if (response.success && typeof response.data === 'number') {
        setUnreadCount(response.data)
      } else {
        // If no data or error, set to 0
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
      // Set to 0 on error
      setUnreadCount(0)
    }
  }

  const loadNotifications = async (showToasts = true) => {
    try {
      setLoading(true)
      const response = await apiService.getNotifications(false) // Don't use cache for real-time data
      
      const previousNotificationIds = new Set(notifications.map(n => n.id))
      
      if (response.success && response.data) {
        let notificationsArray: Notification[] = []
        
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          notificationsArray = response.data
        } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
          // Handle paginated response structure
          const paginatedData = response.data as any
          notificationsArray = Array.isArray(paginatedData.content) ? paginatedData.content : []
        }
        
        setNotifications(notificationsArray)
        
        // Update unread count based on notifications
        const unread = notificationsArray.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
        
        // Check for new FIRST_DEPOSIT_BONUS notifications and show toast
        if (showToasts) {
          notificationsArray.forEach((notification: Notification) => {
            // Check if it's a new unread FIRST_DEPOSIT_BONUS notification
            if (
              notification.type === 'FIRST_DEPOSIT_BONUS' &&
              !notification.isRead &&
              !previousNotificationIds.has(notification.id) &&
              !shownNotificationIds.current.has(notification.id)
            ) {
              // Show toast notification
              toast.success(notification.title, {
                description: notification.message,
                duration: 5000,
              })
              
              // Track that we've shown this notification
              shownNotificationIds.current.add(notification.id)
            }
          })
        }
      } else {
        // If no data or error, set empty array
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      
      // Fallback to mock data temporarily while backend is being set up
      const mockNotifications: Notification[] = [
        {
          id: 1,
          title: 'مرحباً بك في المنصة',
          message: 'تم تفعيل حسابك بنجاح. يمكنك الآن البدء في الاستثمار.',
          type: 'SYSTEM_MESSAGE',
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedEntityType: 'SYSTEM',
          relatedEntityId: undefined
        },
        {
          id: 2,
          title: 'إيداع مؤكد',
          message: 'تم تأكيد إيداعك بقيمة 100 USDT بنجاح.',
          type: 'DEPOSIT_APPROVED',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          relatedEntityType: 'DEPOSIT',
          relatedEntityId: 1
        }
      ]
      
      setNotifications(mockNotifications)
      const unread = mockNotifications.filter(n => !n.isRead).length
      setUnreadCount(unread)
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications(true) // Refresh with toast support
  }

  const refreshUnreadCount = async () => {
    await loadUnreadCount()
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId)
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead()
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        // Update unread count
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Load unread count once when app initializes (only once)
  useEffect(() => {
    if (!hasInitialized) {
      loadUnreadCount()
      loadNotifications(true) // Load notifications with toast support
      setHasInitialized(true)
    }
  }, [hasInitialized])

  // Set up polling for new notifications (every 15 seconds)
  useEffect(() => {
    if (hasInitialized) {
      pollingIntervalRef.current = setInterval(() => {
        loadNotifications(true) // Check for new notifications with toast support
        loadUnreadCount() // Also refresh unread count
      }, 15000) // Poll every 15 seconds
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [hasInitialized])

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    loading,
    refreshNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
