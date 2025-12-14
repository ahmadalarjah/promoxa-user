"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Zap,
  Play
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useLanguage } from "@/contexts/LanguageContext"
import { NavigationHeader } from "@/components/navigation-header"
import { useAuth } from "@/contexts/AuthContext"

interface DailyOrder {
  id: number
  description: string
  descriptionKey?: string
  earningAmount: number
  completedAt: string
  orderNumber: number
  completed: boolean
}

interface OrderStatus {
  canDoOrders: boolean
  ordersCompleted: number
  totalOrders: number
}

export default function OrdersPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [todayTasks, setTodayTasks] = useState<DailyOrder[]>([])
  const [thisWeekOrders, setThisWeekOrders] = useState<DailyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [completingTasks, setCompletingTasks] = useState<Set<number>>(new Set())
  const [error, setError] = useState("")

  const loadOrders = async () => {
    try {
      setError("")
      
      // Load order status
      const statusResponse = await apiService.getDailyOrders()
      if (statusResponse.success && statusResponse.data) {
        setOrderStatus(statusResponse.data as any)
      } else {
        // Set default status if no data
        setOrderStatus({
          canDoOrders: false,
          ordersCompleted: 0,
          totalOrders: 5
        })
      }
      
      // Load today's tasks
      const todayResponse = await apiService.getTodayOrders()
      if (todayResponse.success && todayResponse.data) {
        setTodayTasks(todayResponse.data)
      } else {
        setTodayTasks([])
      }
      
      // Load this week's orders
      const weekResponse = await apiService.getThisWeekOrders()
      if (weekResponse.success && weekResponse.data) {
        setThisWeekOrders(weekResponse.data)
      } else {
        setThisWeekOrders([])
      }
      
    } catch (error) {
      console.error('Error loading orders:', error)
      setError(t('orders.error'))
      // Set default values on error
      setOrderStatus({
        canDoOrders: false,
        ordersCompleted: 0,
        totalOrders: 5
      })
      setTodayTasks([])
      setThisWeekOrders([])
    } finally {
      setLoading(false)
    }
  }



  const completeTask = async (taskId: number) => {
    setCompletingTasks(prev => new Set(prev).add(taskId))
    try {
      const response = await apiService.completeOrder(taskId)
      if (response.success) {
        // Reload orders after completion
        await loadOrders()
        alert(t('orders.taskCompleted'))
      } else {
        alert(response.error || t('orders.failed'))
      }
    } catch (error) {
      alert(t('orders.failed'))
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('orders.loading')}</p>
        </div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: any) => {
    const num = Number(amount) || 0
    return num.toFixed(2)
  }

  const calculateWeekTotal = () => {
    return thisWeekOrders.reduce((total, order) => total + (Number(order.earningAmount) || 0), 0)
  }

  const completedTasks = todayTasks.filter(task => task.completed)
  const pendingTasks = todayTasks.filter(task => !task.completed)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('orders.title')}
          onBack={() => window.history.back()}
        />
        
        <div className="p-4 space-y-6">

          {/* No Plan Message */}
          {!user?.currentPlan && (
            <Card className="bg-orange-500/10 border-orange-500/20 p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <div className="flex-1">
                  <p className="text-orange-400 font-semibold">{t('orders.noPlanTitle')}</p>
                  <p className="text-orange-300 text-sm">{t('orders.noPlanMessage')}</p>
                </div>
                <Link href="/plans">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    {t('orders.getPlan')}
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/20 p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            </Card>
          )}

          {/* Status Card */}
          <Card className="bg-card-custom border-golden/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-golden" />
                <div>
                  <h3 className="text-golden font-semibold">{t('orders.status')}</h3>
                  <p className="text-gray-400 text-sm">
                    {completedTasks.length} {t('orders.completed')} {t('common.of')} 5
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={orderStatus?.canDoOrders ? "default" : "secondary"} 
                  className={orderStatus?.canDoOrders ? "bg-success text-white" : "bg-gray-600"}
                >
                  {orderStatus?.canDoOrders ? t('orders.open') : t('orders.closed')}
                </Badge>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{t('orders.progress')}</span>
                <span>{Math.round((completedTasks.length / 5) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-golden h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(completedTasks.length / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Today's Tasks Section */}
          <Card className="bg-card-custom border-golden/20 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-golden" />
              <h3 className="text-golden font-semibold">{t('orders.todayTasks')}</h3>
            </div>
            
            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div key={task.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white text-sm mb-1">
                          {task.descriptionKey ? t(task.descriptionKey) : task.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-success" />
                            <span className="text-success font-semibold">+{formatAmount(task.earningAmount)} USDT</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">#{task.orderNumber}</span>
                          </div>
                        </div>
                      </div>
                      
                      {task.completed ? (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('orders.completed')}
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => completeTask(task.id)}
                          disabled={completingTasks.has(task.id)}
                          size="sm"
                          className="bg-golden hover:bg-golden/90 text-black font-semibold"
                        >
                          {completingTasks.has(task.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {t('orders.completing')}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {t('orders.complete')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {task.completed && task.completedAt && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>⏰ {formatTime(task.completedAt)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{t('orders.noTasksToday')}</p>
              </div>
            )}
          </Card>

          {/* This Week Section */}
          <Card className="bg-card-custom border-golden/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-golden" />
                <h3 className="text-golden font-semibold">{t('orders.thisWeek')}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-success font-semibold">{formatAmount(calculateWeekTotal())} USDT</span>
              </div>
            </div>
            
            {thisWeekOrders.length > 0 ? (
              <div className="space-y-3">
                {thisWeekOrders.map((order) => (
                  <div key={order.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white text-sm mb-1">
                          {order.descriptionKey ? t(order.descriptionKey) : order.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-success" />
                            <span className="text-success font-semibold">+{formatAmount(order.earningAmount)} USDT</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(order.completedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(order.completedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{t('orders.noTasksThisWeek')}</p>
              </div>
            )}
          </Card>

          {/* Info Section */}
          <Card className="bg-card-custom border-golden/20 p-4">
            <h3 className="text-golden font-semibold mb-3">{t('orders.infoTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• {t('orders.infoDesc1')}</p>
              <p>• {t('orders.infoDesc2')}</p>
              <p>• {t('orders.infoDesc3')}</p>
              <p>• {t('orders.infoDesc4')}</p>
              <p>• {t('orders.infoDesc5')}</p>
              <p>• {t('orders.infoDesc6')}</p>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
