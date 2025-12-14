"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  DollarSign, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
  Clock
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"
import { RefreshCw } from "lucide-react"

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth()
  const { t, isRTL } = useLanguage()
  const [amount, setAmount] = useState("")
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const loadWithdrawals = async () => {
    try {
      const response = await apiService.getWithdrawals()
      if (response.success && response.data) {
        setWithdrawals(response.data)
      }
    } catch (error) {
              // Error loading withdrawals
    } finally {
      setLoading(false)
    }
  }

  const createWithdrawal = async () => {
    if (!amount || parseFloat(amount) < 10) {
      setError(t('withdraw.minAmount'))
      return
    }

    // Check if user has enough balance
    const availableBalance = Number(user?.withdrawableAmount || 0)
    if (parseFloat(amount) > availableBalance) {
      setError(t('withdraw.insufficientBalance'))
      return
    }

    setCreating(true)
    setError("")
    
    try {
      const response = await apiService.createWithdrawal(parseFloat(amount))
      if (response.success) {
        alert(t('withdraw.success'))
        setAmount("")
        // Reload withdrawals
        await loadWithdrawals()
      } else {
        setError(response.error || t('withdraw.error'))
      }
    } catch (error) {
              // Error creating withdrawal
      setError(t('withdraw.error'))
    } finally {
      setCreating(false)
    }
  }

  const handleRefreshUser = async () => {
    setRefreshing(true)
    try {
      await refreshUser()
    } finally {
      setRefreshing(false)
    }
  }





  useEffect(() => {
    loadWithdrawals()
  }, [])

  const availableBalance = Number(user?.withdrawableAmount || 0)
  const fee = parseFloat(amount) * 0.12 // 12% fee
  const netAmount = parseFloat(amount) - fee

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'text-success border-success'
      case 'completed':
        return 'text-success border-success'
      case 'pending':
        return 'text-yellow-400 border-yellow-400'
      case 'rejected':
        return 'text-red-400 border-red-400'
      default:
        return 'text-yellow-400 border-yellow-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return t('transactions.completed')
      case 'completed':
        return t('transactions.completed')
      case 'pending':
        return t('transactions.pending')
      case 'rejected':
        return t('transactions.failed')
      default:
        return t('transactions.pending')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('withdraw.title')}
          onBack={() => window.history.back()}
        />
        
        <div className="p-4">

        {/* Available Balance */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-golden" />
            </div>
            <h3 className="text-golden font-semibold text-lg mb-2">{t('withdraw.available')}</h3>
            <div className="text-3xl font-bold text-white mb-2">{availableBalance.toFixed(2)} USDT</div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleRefreshUser}
                disabled={refreshing}
                className="px-3 py-1 bg-golden/20 text-golden text-xs rounded hover:bg-golden/30 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 inline mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
            </div>
            <p className="text-gray-400 text-sm">{t('withdraw.profitsOnly')}</p>
          </div>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <h3 className="text-golden font-semibold mb-4">{t('withdraw.newRequest')}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">{t('withdraw.amount')} (USDT)</label>
              <Input
                type="number"
                placeholder={t('withdraw.enterAmount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
                min="10"
                step="0.01"
              />
            </div>

            {amount && parseFloat(amount) >= 10 && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('withdraw.requestedAmount')}:</span>
                  <span className="text-white">{parseFloat(amount).toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('withdraw.fee')} (12%):</span>
                  <span className="text-red-400">-{fee.toFixed(2)} USDT</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-golden font-semibold">{t('withdraw.netAmount')}:</span>
                    <span className="text-golden font-semibold">{netAmount.toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <Button
              className="w-full bg-golden hover:bg-golden/90 text-black font-semibold h-12"
              onClick={createWithdrawal}
              disabled={creating || !amount || parseFloat(amount) < 10 || parseFloat(amount) > availableBalance}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('withdraw.processing')}
                </>
              ) : (
                t('withdraw.confirm')
              )}
            </Button>
          </div>
        </Card>

        {/* Wallet Address Info */}
        <Card className="bg-card-custom border-golden/20 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="w-5 h-5 text-golden" />
            <h3 className="text-golden font-semibold">{t('withdraw.address')}</h3>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <p className="text-white font-mono text-sm break-all">
              {user?.walletAddress || t('withdraw.noWalletAddress')}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {t('withdraw.walletAddressFixed')}
            </p>
          </div>
        </Card>

        {/* Withdrawal History */}
        <Card className="bg-card-custom border-golden/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-golden font-semibold">{t('withdraw.history')}</h3>
            <Link href="/transactions">
              <Button variant="ghost" className="text-golden text-sm">
                {t('common.viewAll')}
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-golden animate-spin" />
            </div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.slice(0, 5).map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-golden" />
                    <div>
                      <p className="text-white font-medium">{withdrawal.requestedAmount} USDT</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(withdrawal.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(withdrawal.status)}>
                      {getStatusText(withdrawal.status)}
                    </Badge>
                    <p className="text-gray-400 text-xs mt-1">
                      {t('withdraw.net')}: {withdrawal.finalAmount} USDT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">{t('withdraw.noHistory')}</p>
            </div>
          )}
        </Card>

        {/* Important Notes */}
        <Card className="bg-card-custom border-golden/20 p-6 mt-6">
          <h3 className="text-golden font-semibold mb-4">{t('withdraw.importantInfo')}</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('withdraw.minWithdrawal')}: 10 USDT</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('withdraw.withdrawalFee')}: 12% {t('withdraw.deductedAutomatically')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('withdraw.noWithdrawalIfPending')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('withdraw.processingTime')}: 1 - 72 {t('withdraw.hours')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
              <p>{t('withdraw.walletAddressFixed')}</p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
