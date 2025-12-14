"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign,
  Users,
  Package,
  Loader2,
  MessageSquare,
  Gift,
  TrendingUp,
  XCircle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"
import { useNotifications } from "@/contexts/NotificationContext"
import { useLanguage } from "@/contexts/LanguageContext"

export default function NotificationsPage() {
  const { notifications, loading, refreshNotifications, markAsRead, markAllAsRead } = useNotifications()
  const { t, language } = useLanguage()
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const handleMarkAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId)
    try {
      await markAsRead(notificationId)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  // Load notifications once when user first visits the page
  useEffect(() => {
    if (!hasLoaded) {
      refreshNotifications()
      setHasLoaded(true)
    }
  }, [hasLoaded, refreshNotifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
        return <CheckCircle className="w-5 h-5" />
      case 'DEPOSIT_REJECTED':
        return <XCircle className="w-5 h-5" />
      case 'WITHDRAWAL_APPROVED':
        return <TrendingUp className="w-5 h-5" />
      case 'WITHDRAWAL_REJECTED':
        return <XCircle className="w-5 h-5" />
      case 'SYSTEM_MESSAGE':
        return <MessageSquare className="w-5 h-5" />
      case 'PLAN_PURCHASED':
        return <Gift className="w-5 h-5" />
      case 'REFERRAL_BONUS':
        return <Users className="w-5 h-5" />
      case 'DAILY_EARNINGS':
        return <DollarSign className="w-5 h-5" />
      case 'ADMIN_MESSAGE':
        return <Info className="w-5 h-5" />
      case 'FIRST_DEPOSIT_BONUS':
        return <Gift className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
      case 'WITHDRAWAL_APPROVED':
      case 'REFERRAL_BONUS':
      case 'DAILY_EARNINGS':
      case 'FIRST_DEPOSIT_BONUS':
        return 'text-success'
      case 'DEPOSIT_REJECTED':
      case 'WITHDRAWAL_REJECTED':
        return 'text-red-400'
      case 'ADMIN_MESSAGE':
        return 'text-info'
      default:
        return 'text-info'
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
      case 'WITHDRAWAL_APPROVED':
      case 'REFERRAL_BONUS':
      case 'DAILY_EARNINGS':
      case 'FIRST_DEPOSIT_BONUS':
        return 'bg-success/10'
      case 'DEPOSIT_REJECTED':
      case 'WITHDRAWAL_REJECTED':
        return 'bg-red-400/10'
      case 'ADMIN_MESSAGE':
        return 'bg-info/10'
      default:
        return 'bg-info/10'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (language === 'ar') {
      if (diffInMinutes < 1) return 'الآن'
      if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `منذ ${diffInHours} ساعة`
      
      const diffInDays = Math.floor(diffInHours / 24)
      return `منذ ${diffInDays} يوم`
    } else {
      if (diffInMinutes < 1) return 'Now'
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours} hours ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  // Ensure notifications is always an array and calculate unread count safely
  const notificationsArray = Array.isArray(notifications) ? notifications : []
  const unreadCount = notificationsArray.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('notifications.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('notifications.title')}
          onBack={() => window.history.back()}
        >
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-golden text-golden hover:bg-golden/10"
              onClick={refreshNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-golden text-golden hover:bg-golden/10"
                onClick={handleMarkAllAsRead}
              >
                {t('notifications.markAllAsRead')}
              </Button>
            )}
          </div>
        </NavigationHeader>
        
        <div className="p-4">

        {/* Notifications Count */}
        <Card className="bg-card-custom border-golden/20 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-golden" />
              <div>
                <h3 className="text-golden font-semibold">{t('notifications.title')}</h3>
                <p className="text-gray-400 text-sm">
                  {unreadCount} {t('notifications.unread')} {t('common.of')} {notificationsArray.length}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
        </Card>

        {/* Notifications List */}
        {notificationsArray.length > 0 ? (
          <div className="space-y-4">
            {notificationsArray.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-card-custom border-golden/20 p-4 ${
                  !notification.isRead ? 'border-l-4 border-l-golden' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getNotificationBgColor(notification.type)} ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-300'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markingAsRead === notification.id}
                          className="text-golden hover:text-golden/80"
                        >
                          {markingAsRead === notification.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t('notifications.markAsRead')
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card-custom border-golden/20 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">{t('notifications.noNotifications')}</h3>
            <p className="text-gray-400">
              {t('notifications.noNotificationsDesc')}
            </p>
          </Card>
        )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
