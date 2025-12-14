"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Globe, ChevronDown, Check } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const languages = [
    { code: 'ar', name: t('language.arabic'), flag: '🇸🇦' },
    { code: 'en', name: t('language.english'), flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (langCode: 'ar' | 'en') => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="text-golden hover:bg-golden/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-5 h-5" />
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 bg-card-custom border-golden/20 p-2 min-w-[160px] z-50">
          <div className="space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'ar' | 'en')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-golden/10 transition-colors ${
                  language === lang.code ? 'bg-golden/20 text-golden' : 'text-white'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-golden" />
                )}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
