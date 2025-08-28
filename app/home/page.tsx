"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Package,
  User,
  MessageCircle,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Wallet,
  Gift,
  Headphones,
  ArrowRight,
  Globe,
  Bell,
  LogOut,
  AlertCircle,
  Copy,
  Lock
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { HomeHeader } from "@/components/home-header"

export default function HomePage() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalBalance: 0,
    referralEarnings: 0,
    dailyEarnings: 0,
    totalEarnings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null)

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // Check if in demo mode
      const demoMode = localStorage.getItem('demo_mode') === 'true'
      if (demoMode) {
        setIsDemoMode(true)
        // Use demo stats
        setStats({
          totalBalance: user?.totalBalance || 0,
          referralEarnings: user?.referralEarnings || 0,
          dailyEarnings: user?.dailyEarnings || 0,
          totalEarnings: user?.totalEarnings || 0
        })
        setLoading(false)
        return
      }

      const response = await apiService.getDashboardStats()
      if (response.success && response.data) {
        // Handle different response formats from backend
        const backendData = response.data as any
        setStats({
          totalBalance: backendData.totalAmount || backendData.totalBalance || 0,
          referralEarnings: backendData.referralEarnings || 0,
          dailyEarnings: backendData.dailyEarnings || 0,
          totalEarnings: backendData.totalEarnings || 0
        })
        
        // Auto-upgrade check: Calculate total available balance (including frozen for upgrades)
        const availableBalance = (backendData.totalAmount || backendData.totalBalance || 0)
        const totalBalanceForUpgrade = availableBalance + (user?.frozenBalance || 0)
        const totalBalanceDisplay = availableBalance // For display purposes only
        
        // If user has a plan and total balance for upgrade is significant, check for auto-upgrade
        if (user?.currentPlan && totalBalanceForUpgrade >= 100) { // Only check if total balance is significant
          try {
            // Trigger auto-upgrade check in background
            const upgradeResponse = await apiService.checkAutoUpgrade()
            
            // Check if upgrade happened
            if (upgradeResponse.success && upgradeResponse.data) {
              const upgradeData = upgradeResponse.data
              if (upgradeData.afterUpgrade && upgradeData.beforeUpgrade) {
                const beforePlan = upgradeData.beforeUpgrade.currentPlan
                const afterPlan = upgradeData.afterUpgrade.currentPlan
                
                if (beforePlan !== afterPlan) {
                  // Upgrade happened!
                  setUpgradeNotification(`تم الترقية تلقائياً من ${beforePlan} إلى ${afterPlan}! 🎉`)
                  
                  // Reload user data to reflect the upgrade
                  setTimeout(() => {
                    window.location.reload()
                  }, 3000)
                }
              }
            }
          } catch (upgradeError) {
            // Don't show error to user, just log it
          }
        }
      } else {
        // Failed to load dashboard stats
        // Set default values if API fails
        setStats({
          totalBalance: user?.totalBalance || 0,
          referralEarnings: user?.referralEarnings || 0,
          dailyEarnings: user?.dailyEarnings || 0,
          totalEarnings: user?.totalEarnings || 0
        })
      }
    } catch (error) {
      // Error loading dashboard stats
      // Set default values on error
      setStats({
        totalBalance: user?.totalBalance || 0,
        referralEarnings: user?.referralEarnings || 0,
        dailyEarnings: user?.dailyEarnings || 0,
        totalEarnings: user?.totalEarnings || 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardStats()
  }, [user]) // Added user to dependency array to re-load stats if user changes (e.g., after login)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
          <p className="text-gray-400">{t('home.loading')}</p>
        </div>
      </div>
    )
  }

  const statsData = [
    {
      title: t('home.totalBalance'),
      value: Number(stats.totalBalance || 0).toFixed(2),
      currency: "USDT",
      icon: DollarSign,
      color: "text-golden"
    },
    {
      title: t('home.totalProfit'),
      value: Number(user?.totalProfit || 0).toFixed(2),
      currency: "USDT",
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: t('home.frozenBalance'),
      value: Number(user?.frozenBalance || 0).toFixed(2),
      currency: "USDT",
      icon: Lock,
      color: "text-orange-400"
    },
    {
      title: t('home.referralEarnings'),
      value: Number(stats.referralEarnings || 0).toFixed(2),
      currency: "USDT",
      icon: Users,
      color: "text-success"
    },
    {
      title: t('home.dailyEarnings'),
      value: Number(stats.dailyEarnings || 0).toFixed(2),
      currency: "USDT",
      icon: TrendingUp,
      color: "text-info"
    }
  ]

  const operations = [
    { title: t('home.orders'), icon: Calendar, href: "/orders", color: "text-blue-400" },
    { title: t('home.withdraw'), icon: Wallet, href: "/withdraw", color: "text-green-400" },
    { title: t('home.deposit'), icon: DollarSign, href: "/deposit", color: "text-golden" },
    { title: t('home.team'), icon: Users, href: "/team", color: "text-purple-400" },
    { title: t('home.support'), icon: Headphones, href: "/support", color: "text-orange-400" },
    { title: t('home.promoCode'), icon: Gift, href: "/promo", color: "text-pink-400" },
    { title: t('home.plans'), icon: Package, href: "/plans", color: "text-cyan-400" },
    { title: t('home.community'), icon: MessageCircle, href: "/community", color: "text-indigo-400" },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] pb-20">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">
                {t('home.demoMode')}
              </span>
            </div>
          </div>
        )}

        {/* Auto-Upgrade Notification */}
        {upgradeNotification && (
          <div className="bg-green-500/10 border-b border-green-500/20 p-3">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">
                {upgradeNotification}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <HomeHeader 
          user={user}
          onLogout={logout}
          onCopyReferralCode={copyReferralCode}
          copied={copied}
        />

        <div className="p-4 sm:p-6 space-y-6 pb-20">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {statsData.map((stat, index) => (
              <Card key={index} className="bg-card-custom border-golden/20 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{stat.title}</p>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className={`text-lg sm:text-xl font-bold ${stat.color} truncate`}>
                        {stat.value}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{stat.currency}</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-full bg-golden/10 ${stat.color} flex-shrink-0 ml-2`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Operations Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {operations.map((operation, index) => (
              <Link key={index} href={operation.href}>
                <Card className="bg-card-custom border-golden/20 p-3 sm:p-4 hover:bg-golden/5 transition-colors cursor-pointer touch-target">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`p-2 rounded-full bg-golden/10 ${operation.color} flex-shrink-0`}>
                      <operation.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base truncate">{operation.title}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Link href="/orders">
            <Button className="w-full bg-golden hover:bg-golden/90 text-black font-semibold h-12 text-lg">
              {t('home.startDailyTasks')}
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>

          {/* News Section */}
          <Card className="bg-card-custom border-golden/20 p-4">
            <h3 className="text-golden font-semibold mb-3">{t('home.news')}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm">{t('home.news.feature')}</p>
                  <p className="text-gray-400 text-xs">{t('home.news.2hoursAgo')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm">{t('home.news.update')}</p>
                  <p className="text-gray-400 text-xs">{t('home.news.1dayAgo')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm">{t('home.news.offers')}</p>
                  <p className="text-gray-400 text-xs">{t('home.news.3daysAgo')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card-custom border-t border-golden/20 shadow-lg pb-safe">
          <div className="flex justify-around p-3">
            <Link href="/home" className="flex flex-col items-center p-2 text-golden rounded-lg hover:bg-golden/10 transition-colors">
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{t('home.title')}</span>
            </Link>
            <Link href="/plans" className="flex flex-col items-center p-2 text-gray-400 hover:text-golden rounded-lg hover:bg-golden/10 transition-colors">
              <Package className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{t('home.plans')}</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400 hover:text-golden rounded-lg hover:bg-golden/10 transition-colors">
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{t('home.profile')}</span>
            </Link>
            <Link href="/community" className="flex flex-col items-center p-2 text-gray-400 hover:text-golden rounded-lg hover:bg-golden/10 transition-colors">
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{t('home.community')}</span>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
