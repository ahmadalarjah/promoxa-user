"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Gift, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"

export default function PromoPage() {
  const { t, isRTL } = useLanguage()
  const [promoCode, setPromoCode] = useState("")
  const [promoHistory, setPromoHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadPromoHistory = async () => {
    try {
      const response = await apiService.getUserPromoCodes()
      if (response.success && response.data) {
        setPromoHistory(response.data)
      }
    } catch (error) {
      console.error('Error loading promo history:', error)
    } finally {
      setLoading(false)
    }
  }

  const activatePromoCode = async () => {
    if (!promoCode.trim()) {
      setError(t('promo.enterCodeError'))
      return
    }

    setActivating(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await apiService.activatePromoCode(promoCode.trim())
      if (response.success) {
        // Extract message from response data
        const message = response.data?.message || t('promo.activationSuccess')
        setSuccess(message)
        setPromoCode("")
        // Reload history
        await loadPromoHistory()
      } else {
        setError(response.error || t('promo.activationError'))
      }
    } catch (error: any) {
      console.error('Error activating promo code:', error)
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError(t('promo.activationError'))
      }
    } finally {
      setActivating(false)
    }
  }

  useEffect(() => {
    loadPromoHistory()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('promo.title')}
          onBack={() => window.history.back()}
        />
        
        <div className="p-4">

        {/* Activate Promo Code */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-golden" />
            </div>
            <h3 className="text-golden font-semibold text-lg mb-2">{t('promo.activateTitle')}</h3>
            <p className="text-gray-400 text-sm">{t('promo.activateDescription')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">{t('promo.code')}</label>
              <Input
                type="text"
                placeholder={t('promo.enterCode')}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 text-center text-lg font-mono"
                disabled={activating}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            <Button
              className="w-full bg-golden hover:bg-golden/90 text-black font-semibold h-12"
              onClick={activatePromoCode}
              disabled={activating || !promoCode.trim()}
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('promo.activating')}
                </>
              ) : (
                t('promo.activate')
              )}
            </Button>
          </div>
        </Card>

        {/* Promo History */}
        <Card className="bg-card-custom border-golden/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-golden font-semibold">{t('promo.history')}</h3>
            <Badge variant="outline" className="text-golden border-golden">
              {promoHistory.length} {t('promo.code')}
            </Badge>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-golden animate-spin" />
            </div>
          ) : promoHistory.length > 0 ? (
            <div className="space-y-3">
              {promoHistory.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5 text-golden" />
                    <div>
                      <p className="text-white font-medium font-mono">{promo.code}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(promo.usedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {promo.bonusAmount && (
                      <div className="flex items-center space-x-1 text-success">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">{promo.bonusAmount} USDT</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-success border-success text-xs">
                      {t('promo.activated')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">{t('promo.noHistory')}</p>
              <p className="text-gray-500 text-sm">{t('promo.noHistoryDesc')}</p>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="bg-card-custom border-golden/20 p-6 mt-6">
          <h3 className="text-golden font-semibold mb-4">{t('promo.infoTitle')}</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div key="info-1" className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('promo.infoOneTime')}</p>
            </div>
            <div key="info-2" className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('promo.infoFullActivation')}</p>
            </div>
            <div key="info-3" className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('promo.infoContests')}</p>
            </div>
            <div key="info-4" className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('promo.infoImmediate')}</p>
            </div>
            <div key="info-5" className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('promo.infoKeepSafe')}</p>
            </div>
          </div>
        </Card>

        {/* Special Offers */}
        <Card className="bg-card-custom border-golden/20 p-6 mt-6">
          <h3 className="text-golden font-semibold mb-4">{t('promo.specialOffers')}</h3>
          <div className="space-y-4">
            <div key="offer-welcome" className="p-4 bg-gradient-to-r from-golden/10 to-transparent rounded-lg border border-golden/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">{t('promo.welcomeOffer')}</h4>
                <Badge variant="outline" className="text-success border-success">
                  {t('promo.new')}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                {t('promo.welcomeOfferDesc')}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{t('promo.newUsersOnly')}</span>
              </div>
            </div>

            <div key="offer-referral" className="p-4 bg-gradient-to-r from-info/10 to-transparent rounded-lg border border-info/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">{t('promo.referralOffer')}</h4>
                <Badge variant="outline" className="text-info border-info">
                  {t('promo.limited')}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                {t('promo.referralOfferDesc')}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{t('promo.limitedTime')}</span>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
