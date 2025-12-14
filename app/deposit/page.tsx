"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  Copy, 
  QrCode, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Gift
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DepositPage() {
  const { t, isRTL } = useLanguage()
  const [amount, setAmount] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [depositAddress, setDepositAddress] = useState("")
  const [minDepositAmount, setMinDepositAmount] = useState(10) // Default fallback
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [isFirstDepositEligible, setIsFirstDepositEligible] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const loadDepositAddress = async () => {
    setLoading(true)
    try {
      const response = await apiService.getDepositInfo()
      if (response.success && response.data) {
        setDepositAddress(response.data.address)
        setMinDepositAmount(response.data.minAmount)
      } else {
        setError(response.error || t('deposit.loadAddressError'))
      }
    } catch (error) {
      // Error loading deposit address
      setError(t('deposit.loadAddressError'))
    } finally {
      setLoading(false)
    }
  }

  const checkFirstDepositEligibility = async () => {
    setCheckingEligibility(true)
    try {
      const response = await apiService.checkFirstDepositEligibility()
      if (response.success && response.data) {
        setIsFirstDepositEligible(response.data.eligible)
      }
    } catch (error) {
      // Silently fail - don't show error for eligibility check
    } finally {
      setCheckingEligibility(false)
    }
  }

  const createDeposit = async () => {
    if (!amount || parseFloat(amount) < minDepositAmount) {
      setError(t('deposit.minAmount', { minAmount: minDepositAmount }))
      return
    }

    setCreating(true)
    setError("")
    
    try {
      const response = await apiService.createDeposit(parseFloat(amount), transactionHash)
      if (response.success && response.data) {
        setDepositAddress(response.data.depositAddress)
        alert(t('deposit.success'))
      } else {
        setError(response.error || t('deposit.error'))
      }
    } catch (error) {
      // Error creating deposit
      setError(t('deposit.error'))
    } finally {
      setCreating(false)
    }
  }

  const copyAddress = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    loadDepositAddress()
    checkFirstDepositEligibility()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/home">
            <Button variant="ghost" className="text-golden">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              {t('common.back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-golden">{t('deposit.title')}</h1>
          <div></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
              <p className="text-gray-400">{t('deposit.loadingAddress')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Deposit Address Card */}
            <Card className="bg-card-custom border-golden/20 p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-golden" />
                </div>
                <h3 className="text-golden font-semibold text-lg mb-2">{t('deposit.address')}</h3>
                <p className="text-gray-400 text-sm">USDT - TRC20</p>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono text-sm break-all">
                    {depositAddress || t('deposit.loading')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    disabled={!depositAddress}
                    className="text-golden hover:text-golden/80"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  {copied ? t('common.copied') : t('deposit.clickToCopy')}
                </p>
              </div>
            </Card>

            {/* First Deposit Bonus Banner */}
            {isFirstDepositEligible && (
              <Card className="bg-gradient-to-r from-golden/20 to-orange-500/20 border-golden/40 p-6 mb-6 animate-fadeInUp">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-golden/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-golden" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-golden font-bold text-lg mb-2">
                      🎉 {t('deposit.firstDepositBonus.title')}
                    </h3>
                    <p className="text-white mb-3">
                      {t('deposit.firstDepositBonus.description')}
                    </p>
                    {amount && parseFloat(amount) > 0 && (
                      <div className="bg-[#1a1a1a]/50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-gray-300 mb-1">{t('deposit.firstDepositBonus.youWillGet')}:</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{parseFloat(amount).toFixed(2)} USDT</span>
                          <span className="text-golden">+</span>
                          <span className="text-golden font-bold">{(parseFloat(amount) * 0.10).toFixed(2)} USDT</span>
                          <span className="text-gray-400">=</span>
                          <span className="text-green-400 font-bold">{(parseFloat(amount) * 1.10).toFixed(2)} USDT</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{t('deposit.firstDepositBonus.note')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Amount Input */}
            <Card className="bg-card-custom border-golden/20 p-6 mb-6">
              <h3 className="text-golden font-semibold mb-4">{t('deposit.depositAmount')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">{t('deposit.amount')} (USDT)</label>
                  <Input
                    type="number"
                    placeholder={t('deposit.enterAmount')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
                    min={minDepositAmount}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">{t('deposit.transactionHash')} (Optional)</label>
                  <Input
                    type="text"
                    placeholder={t('deposit.enterTransactionHash')}
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">{t('deposit.transactionHashHelp')}</p>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}

                <Button
                  className="w-full bg-golden hover:bg-golden/90 text-black font-semibold h-12"
                  onClick={createDeposit}
                  disabled={creating || !amount || parseFloat(amount) < minDepositAmount}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('deposit.processing')}
                    </>
                  ) : (
                    t('deposit.confirm')
                  )}
                </Button>
              </div>
            </Card>

            {/* Important Notes */}
            <Card className="bg-card-custom border-golden/20 p-6">
              <h3 className="text-golden font-semibold mb-4">{t('deposit.importantNotes')}</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                  <p>{t('deposit.minDeposit')}: {minDepositAmount} USDT</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                  <p>{t('deposit.trc20Only')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                  <p>{t('deposit.singleAddress')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                  <p>{t('deposit.verifyAddress')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                  <p>{t('deposit.confirmationTime')}</p>
                </div>
              </div>
            </Card>

            {/* Recent Deposits */}
            <Card className="bg-card-custom border-golden/20 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-golden font-semibold">{t('deposit.recentDeposits')}</h3>
                <Link href="/transactions">
                  <Button variant="ghost" className="text-golden text-sm">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-golden" />
                    <div>
                      <p className="text-white font-medium">100 USDT</p>
                      <p className="text-gray-400 text-sm">{t('deposit.twoHoursAgo')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success border-success">
                    {t('transactions.completed')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-golden" />
                    <div>
                      <p className="text-white font-medium">50 USDT</p>
                      <p className="text-gray-400 text-sm">{t('deposit.fiveHoursAgo')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    {t('transactions.pending')}
                  </Badge>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
