"use client"

import { Bell, Copy, LogOut, User, Settings, Menu, X, Globe, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import Link from "next/link"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLanguage } from "@/contexts/LanguageContext"
import { useNotifications } from "@/contexts/NotificationContext"

interface HomeHeaderProps {
  user: any
  onLogout: () => void
  onCopyReferralCode: () => void
  copied: boolean
}

export function HomeHeader({ user, onLogout, onCopyReferralCode, copied }: HomeHeaderProps) {
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { unreadCount, refreshUnreadCount } = useNotifications()
  
  // Ensure unreadCount is always a valid number and don't show badge if 0
  const safeUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0
  const showNotificationBadge = safeUnreadCount > 0

  const handleRefreshNotifications = async () => {
    try {
      await refreshUnreadCount()
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    }
  }

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
    // Reset language dropdown when menu closes
    if (isMenuOpen) {
      setIsLanguageOpen(false)
    }
  }

  const handleLanguageToggle = () => {
    setIsLanguageOpen(!isLanguageOpen)
  }

  const handleLanguageChange = (langCode: 'ar' | 'en') => {
    setLanguage(langCode)
    setIsLanguageOpen(false)
  }

  const languages = [
    { code: 'ar', name: t('language.arabic'), flag: '🇸🇦' },
    { code: 'en', name: t('language.english'), flag: '🇺🇸' }
  ]

  return (
    <div className="sticky top-0 z-50 bg-card-custom border-b border-golden/20 shadow-lg">
      {/* Main Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          {/* User Info Section */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-golden/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-golden" />
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-golden truncate">
                {user?.fullName || 'User'}
              </h1>
              
                             {/* Referral Code Section */}
               <div className="flex items-center space-x-2 mt-1">
                 <span className="text-xs sm:text-sm text-gray-400">{t('home.referralCode')}:</span>
                 <Badge 
                   variant="outline" 
                   className="text-golden border-golden text-xs px-2 py-0.5"
                 >
                   {user?.referralCode || 'N/A'}
                 </Badge>
                <button
                  onClick={onCopyReferralCode}
                  className="text-golden hover:text-golden/80 transition-colors p-1"
                  disabled={!user?.referralCode}
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                {copied && (
                  <span className="text-xs text-success">Copied!</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Notifications */}
            <Link href="/notifications">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-golden hover:text-golden/80 hover:bg-golden/10 relative"
                onClick={handleRefreshNotifications}
                title="تحديث الإشعارات"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {showNotificationBadge && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center p-0">
                    {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMenuToggle}
                className="h-10 w-10 text-golden hover:text-golden/80 hover:bg-golden/10"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* Logout Button - Desktop */}
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                onClick={onLogout}
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-card-custom border-b border-golden/20 shadow-lg">
          <div className="px-4 py-3 space-y-3">
              {/* Language Switcher - Mobile */}
              <div className="space-y-2">
                <button
                  onClick={handleLanguageToggle}
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-golden/10 transition-all duration-200 border border-transparent hover:border-golden/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-golden/10 rounded-lg">
                      <Globe className="w-5 h-5 text-golden" />
                    </div>
                                         <div className="flex flex-col items-start">
                       <span className="text-white font-medium">{t('language.switch')}</span>
                       <span className="text-xs text-gray-400">
                         {language === 'ar' ? 'العربية' : 'English'}
                       </span>
                     </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isLanguageOpen && (
                  <div className="ml-4 space-y-2 bg-gray-800/30 rounded-xl p-3 border border-golden/10">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code as 'ar' | 'en')}
                        className={`w-full flex items-center space-x-4 p-3 rounded-lg text-left transition-all duration-200 ${
                          language === lang.code 
                            ? 'bg-golden/20 text-golden border border-golden/30 shadow-sm' 
                            : 'text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${language === lang.code ? 'bg-golden/20' : 'bg-gray-700/50'}`}>
                          <span className="text-xl">{lang.flag}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{lang.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {lang.code === 'ar' ? 'العربية' : 'English'}
                          </div>
                        </div>
                        {language === lang.code && (
                          <div className="p-1 bg-golden/20 rounded-full">
                            <Check className="w-4 h-4 text-golden" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Settings Link */}
            <Link href="/profile">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-golden/5 transition-colors">
                <Settings className="w-5 h-5 text-golden" />
                <span className="text-white">{t('profile.settings')}</span>
              </div>
            </Link>

            {/* Notifications Link - Mobile */}
            <Link href="/notifications">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-golden/5 transition-colors relative">
                <Bell className="w-5 h-5 text-golden" />
                <span className="text-white">الإشعارات</span>
                {showNotificationBadge && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs">
                    {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
                  </Badge>
                )}
              </div>
            </Link>

            {/* Logout Button - Mobile */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-400/10 transition-colors w-full text-left"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
