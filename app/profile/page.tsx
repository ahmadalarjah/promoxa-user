"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Wallet, 
  Crown,
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  Lock
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t, language, isRTL } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    email: user?.email || "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiService.updateProfile(formData)
      if (response.success) {
        setSuccess(t('profile.success'))
        setIsEditing(false)
        
        // Add a small delay to ensure the backend has processed the update
        setTimeout(async () => {
          await refreshUser()
        }, 100)
        
      } else {
        setError(response.error || t('profile.error'))
      }
    } catch (error) {
      setError(t('profile.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
    })
    setIsEditing(false)
    setError("")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('profile.loading')}</p>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-golden">{t('profile.title')}</h1>
          <div></div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
            <span className="text-green-400 text-sm">{success}</span>
          </div>
        )}

        {/* Profile Info */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-golden">{t('profile.personalInfo')}</h2>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-golden text-golden hover:bg-golden/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('profile.edit')}
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-golden hover:bg-golden/90 text-black"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t('profile.save')}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-600 text-gray-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('profile.cancel')}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.fullName')}</label>
                {isEditing ? (
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-[#1a1a1a] border-golden/20 text-white"
                  />
                ) : (
                  <p className="text-white">{user.fullName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.phone')}</label>
                {isEditing ? (
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="bg-[#1a1a1a] border-golden/20 text-white"
                  />
                ) : (
                  <p className="text-white">{user.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.email')}</label>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#1a1a1a] border-golden/20 text-white"
                  />
                ) : (
                  <p className="text-white">{user.email || t('common.undefined')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.username')}</label>
                <p className="text-white">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.referralCode')}</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono">{user.referralCode}</p>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(user.referralCode)
                      setSuccess(t('profile.referralCodeCopied'))
                    }}
                    variant="outline"
                    size="sm"
                    className="border-golden/20 text-golden hover:bg-golden/10"
                  >
                    {t('common.copy')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <h2 className="text-xl font-semibold text-golden mb-4">{t('profile.accountInfo')}</h2>
          
          <div className="space-y-4">
            {user.currentPlan && (
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-golden" />
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-1">{t('profile.currentPlan')}</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-white">{user.currentPlan.name}</p>
                    <Badge variant="outline" className="text-golden border-golden">
                      {t('profile.active')}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {t('profile.dailyProfit')}: {user.currentPlan.minDailyEarning} - {user.currentPlan.maxDailyEarning} {t('plans.usdt')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.frozenBalance')}</label>
                <p className="text-white font-semibold">
                  {Number(user.frozenBalance || 0).toFixed(2)} {t('plans.usdt')}
                </p>
                <p className="text-gray-400 text-sm">
                  {t('profile.frozenBalanceDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-golden" />
              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">{t('profile.walletAddress')}</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono text-sm break-all">
                    {user.walletAddress || t('common.undefined')}
                  </p>
                  {user.walletAddress && (
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(user.walletAddress!)
                        setSuccess(t('profile.walletAddressCopied'))
                      }}
                      variant="outline"
                      size="sm"
                      className="border-golden/20 text-golden hover:bg-golden/10"
                    >
                      {t('common.copy')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="bg-card-custom border-golden/20 p-6">
          <h2 className="text-xl font-semibold text-golden mb-4">{t('profile.actions')}</h2>
          
          <div className="space-y-3">
            <Link href="/change-password">
              <Button className="w-full bg-golden hover:bg-golden/90 text-black">
                {t('profile.changePassword')}
              </Button>
            </Link>
            
            <Link href="/support">
              <Button variant="outline" className="w-full border-golden/20 text-golden hover:bg-golden/10">
                {t('profile.contactSupport')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
