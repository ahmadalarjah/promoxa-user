"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Crown, 
  Star, 
  Check,
  ArrowLeft,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function PlansPage() {
  const { user } = useAuth()
  const { t, language, isRTL } = useLanguage()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)

  const loadPlans = async () => {
    try {
      const response = await apiService.getPlans()
      if (response.success && response.data) {
        setPlans(response.data)
      }
    } catch (error) {
              // Error loading plans
    } finally {
      setLoading(false)
    }
  }

  const purchasePlan = async (planId: number) => {
    setPurchasing(planId)
    try {
      const response = await apiService.purchasePlan(planId)
      if (response.success) {
        // Extract message from response data
        const message = response.data?.message || t('plans.success')
        alert(message)
        // Reload plans after purchase
        await loadPlans()
      } else {
        alert(response.error || t('plans.error'))
      }
    } catch (error) {
              // Error purchasing plan
      alert(t('plans.error'))
    } finally {
      setPurchasing(null)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('plans.loading')}</p>
        </div>
      </div>
    )
  }

  const getPlanIcon = (price: number) => {
    if (price >= 5000) return <Crown className="w-6 h-6 text-golden" />
    if (price >= 1500) return <Star className="w-6 h-6 text-golden" />
    return <TrendingUp className="w-6 h-6 text-golden" />
  }

  const getPlanColor = (price: number) => {
    if (price >= 5000) return "border-golden bg-gradient-to-br from-golden/10 to-transparent"
    if (price >= 1500) return "border-golden/60 bg-gradient-to-br from-golden/5 to-transparent"
    return "border-golden/30"
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/home">
            <Button variant="ghost" className="text-golden">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-golden">{t('plans.title')}</h1>
          <div></div>
        </div>

        {/* Current Plan Info */}
        {user?.currentPlan && (
          <Card className="bg-card-custom border-golden/20 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-golden font-semibold">{t('plans.currentPlan')}</h3>
                <p className="text-white">{user.currentPlan.name}</p>
                <p className="text-gray-400 text-sm">
                  {t('plans.dailyProfit')}: {user.currentPlan.minDailyEarning} - {user.currentPlan.maxDailyEarning} {t('plans.usdt')}
                </p>
              </div>
              <Badge variant="outline" className="text-golden border-golden">
                {t('plans.active')}
              </Badge>
            </div>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`bg-card-custom ${getPlanColor(plan.price)} p-6 relative`}
            >
              {/* Plan Icon */}
              <div className="flex justify-center mb-4">
                {getPlanIcon(plan.price)}
              </div>

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-golden">{plan.price}</span>
                <span className="text-gray-400 ml-1">{t('plans.usdt')}</span>
              </div>

              {/* Daily Profit */}
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">{t('plans.dailyProfit')}</p>
                <p className="text-lg font-semibold text-success">
                  {plan.minDailyEarning} - {plan.maxDailyEarning} {t('plans.usdt')}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-success mr-2" />
                  <span className="text-gray-300">{t('plans.feature1')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-success mr-2" />
                  <span className="text-gray-300">{t('plans.feature2')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-success mr-2" />
                  <span className="text-gray-300">{t('plans.feature3')}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <Button 
                className="w-full bg-golden hover:bg-golden/90 text-black font-semibold"
                onClick={() => purchasePlan(plan.id)}
                disabled={purchasing === plan.id}
              >
                {purchasing === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('plans.purchasing')}
                  </>
                ) : (
                  t('plans.buyNow')
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="bg-card-custom border-golden/20 p-4 mt-6">
          <h3 className="text-golden font-semibold mb-3">{t('plans.importantInfo')}</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• {t('plans.info1')}</p>
            <p>• {t('plans.info2')}</p>
            <p>• {t('plans.info3')}</p>
            <p>• {t('plans.info4')}</p>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
