"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  DollarSign, 
  Users, 
  Headphones, 
  Shield,
  ArrowRight,
  Star
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function LandingPage() {
  const { t } = useLanguage()

  const features = [
    {
      icon: DollarSign,
      title: t('landing.features.daily'),
      description: t('landing.features.daily')
    },
    {
      icon: Users,
      title: t('landing.features.referral'),
      description: t('landing.features.referral')
    },
    {
      icon: Headphones,
      title: t('landing.features.support'),
      description: t('landing.features.support')
    },
    {
      icon: Shield,
      title: t('landing.features.secure'),
      description: t('landing.features.secure')
    }
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-card-custom border-b border-golden/20 p-3 sm:p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-golden rounded-lg flex items-center justify-center">
              <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-golden">{t('landing.title')}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-golden hover:bg-golden/10 text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                {t('landing.login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-golden hover:bg-golden/90 text-black font-semibold text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                {t('landing.register')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-golden mb-4 sm:mb-6 leading-tight">
          {t('landing.subtitle')}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
          {t('landing.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="bg-golden hover:bg-golden/90 text-black font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
              {t('landing.getStarted')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="border-golden text-golden hover:bg-golden/10 text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
              {t('landing.login')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-golden text-center mb-8 sm:mb-12">
          {t('landing.features.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card-custom border-golden/20 p-4 sm:p-6 text-center hover:bg-golden/5 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-golden" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-golden mb-4 sm:mb-6">
          {t('landing.getStarted')}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          {t('landing.description')}
        </p>
        <Link href="/register" className="inline-block w-full sm:w-auto">
          <Button className="bg-golden hover:bg-golden/90 text-black font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
            {t('landing.getStarted')}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="bg-card-custom border-t border-golden/20 p-6 sm:p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-golden rounded-lg flex items-center justify-center">
              <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-golden">{t('landing.title')}</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4 leading-relaxed">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <Link href="/login" className="text-golden hover:text-golden/80 text-sm sm:text-base">
              {t('landing.login')}
            </Link>
            <Link href="/register" className="text-golden hover:text-golden/80 text-sm sm:text-base">
              {t('landing.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
