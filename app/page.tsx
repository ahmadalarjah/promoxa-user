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
      <div className="bg-card-custom border-b border-golden/20 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-golden rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-golden">{t('landing.title')}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-golden hover:bg-golden/10">
                {t('landing.login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-golden hover:bg-golden/90 text-black font-semibold">
                {t('landing.register')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-golden mb-6">
          {t('landing.subtitle')}
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          {t('landing.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button className="bg-golden hover:bg-golden/90 text-black font-semibold text-lg px-8 py-3">
              {t('landing.getStarted')}
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-golden text-golden hover:bg-golden/10 text-lg px-8 py-3">
              {t('landing.login')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-golden text-center mb-12">
          {t('landing.features.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card-custom border-golden/20 p-6 text-center hover:bg-golden/5 transition-colors">
              <div className="w-12 h-12 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-golden" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-card-custom border-t border-golden/20 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-golden mb-2">10,000+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-golden mb-2">$2M+</div>
              <div className="text-gray-400">Total Earnings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-golden mb-2">4.9</div>
              <div className="text-gray-400 flex items-center justify-center">
                <Star className="w-5 h-5 text-golden mr-1" />
                User Rating
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-golden mb-6">
          {t('landing.getStarted')}
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          {t('landing.description')}
        </p>
        <Link href="/register">
          <Button className="bg-golden hover:bg-golden/90 text-black font-semibold text-lg px-8 py-3">
            {t('landing.getStarted')}
            <ArrowRight className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="bg-card-custom border-t border-golden/20 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-golden rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-xl font-bold text-golden">{t('landing.title')}</h3>
          </div>
          <p className="text-gray-400 mb-4">
            {t('landing.description')}
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/login" className="text-golden hover:text-golden/80">
              {t('landing.login')}
            </Link>
            <Link href="/register" className="text-golden hover:text-golden/80">
              {t('landing.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
