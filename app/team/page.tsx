"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  User, 
  TrendingUp, 
  DollarSign,
  ArrowLeft,
  Loader2,
  Crown,
  Star
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"

export default function TeamPage() {
  const { t, isRTL } = useLanguage()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    directMembers: 0,
    indirectMembers: 0,
    totalEarnings: 0
  })
  const [loading, setLoading] = useState(true)

  const loadTeamData = async () => {
    try {
      const [membersResponse, statsResponse] = await Promise.all([
        apiService.getTeamMembers(),
        apiService.getTeamStats()
      ])

      if (membersResponse.success && membersResponse.data) {
        // Ensure teamMembers is always an array
        const members = Array.isArray(membersResponse.data) ? membersResponse.data : []
        setTeamMembers(members)
      } else {
        // If API fails or returns invalid data, set empty array
        setTeamMembers([])
      }

      if (statsResponse.success && statsResponse.data) {
        setTeamStats(statsResponse.data)
      }
    } catch (error) {
              // Error loading team data
      // Ensure teamMembers is always an array even on error
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeamData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('team.loading')}</p>
        </div>
      </div>
    )
  }

  // Ensure teamMembers is always an array before filtering
  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : []
  const directMembers = safeTeamMembers.filter(member => member && member.isDirect)
  const indirectMembers = safeTeamMembers.filter(member => member && !member.isDirect)

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return name || ''
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
  }

  const statsData = [
    {
      title: t('team.totalMembers'),
      value: teamStats.totalMembers || 0,
      icon: Users,
      color: "text-golden"
    },
    {
      title: t('team.directMembers'),
      value: teamStats.directMembers || 0,
      icon: Crown,
      color: "text-success"
    },
    {
      title: t('team.indirectMembers'),
      value: teamStats.indirectMembers || 0,
      icon: Star,
      color: "text-info"
    },
    {
      title: t('team.totalEarnings'),
      value: (parseFloat(teamStats.totalEarnings?.toString() || '0') || 0).toFixed(2),
      icon: DollarSign,
      color: "text-golden",
      currency: "USDT"
    }
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('team.title')}
          onBack={() => window.history.back()}
        />
        
        <div className="p-4">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="bg-card-custom border-golden/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-white">{stat.value}</span>
                    {stat.currency && (
                      <span className="text-sm text-gray-400">{stat.currency}</span>
                    )}
                  </div>
                </div>
                <div className="p-2 rounded-full bg-golden/10">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Referral System Info */}
        <Card className="bg-card-custom border-golden/20 p-4 mb-6">
          <h3 className="text-golden font-semibold mb-3">{t('team.referralSystem')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <Crown className="w-8 h-8 text-success mx-auto mb-2" />
              <h4 className="text-white font-semibold">{t('team.level1')}</h4>
              <p className="text-success font-bold">12%</p>
              <p className="text-gray-400 text-sm">{t('team.direct')}</p>
            </div>
            <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
              <Star className="w-8 h-8 text-info mx-auto mb-2" />
              <h4 className="text-white font-semibold">{t('team.level2')}</h4>
              <p className="text-info font-bold">6%</p>
              <p className="text-gray-400 text-sm">{t('team.indirect')}</p>
            </div>
          </div>
        </Card>

        {/* Direct Members */}
        <Card className="bg-card-custom border-golden/20 p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-5 h-5 text-success" />
            <h3 className="text-golden font-semibold">{t('team.directMembers')} ({directMembers.length})</h3>
          </div>
          
          {directMembers.length > 0 ? (
            <div className="space-y-3">
              {directMembers.map((member) => (
                <div key={member.id || Math.random()} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-golden/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-golden" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{member.fullName || t('team.unknownMember')}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('team.joinedOn')} {member.joinDate ? new Date(member.joinDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('team.undefined')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-golden font-semibold">{parseFloat(member.depositAmount?.toString() || '0').toFixed(2)} USDT</div>
                    <Badge variant="outline" className="text-success border-success text-xs">
                      {t('team.direct')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">{t('team.noDirectMembers')}</p>
              <p className="text-gray-500 text-sm">{t('team.shareReferralCode')}</p>
            </div>
          )}
        </Card>

        {/* Indirect Members */}
        <Card className="bg-card-custom border-golden/20 p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-5 h-5 text-info" />
            <h3 className="text-golden font-semibold">{t('team.indirectMembers')} ({indirectMembers.length})</h3>
          </div>
          
          {indirectMembers.length > 0 ? (
            <div className="space-y-3">
              {indirectMembers.map((member) => (
                <div key={member.id || Math.random()} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-golden/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-golden" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{maskName(member.fullName || t('team.unknownMember'))}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('team.joinedOn')} {member.joinDate ? new Date(member.joinDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('team.undefined')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-golden font-semibold">{parseFloat(member.depositAmount?.toString() || '0').toFixed(2)} USDT</div>
                    <Badge variant="outline" className="text-info border-info text-xs">
                      {t('team.indirect')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">{t('team.noIndirectMembers')}</p>
              <p className="text-gray-500 text-sm">{t('team.indirectMembersDesc')}</p>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="bg-card-custom border-golden/20 p-4">
          <h3 className="text-golden font-semibold mb-3">{t('team.importantInfo')}</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• {t('team.level1Info')}</p>
            <p>• {t('team.level2Info')}</p>
            <p>• {t('team.earningsInfo')}</p>
            <p>• {t('team.privacyInfo')}</p>
            <p>• {t('team.unlimitedMembers')}</p>
          </div>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
