"use client"

import { ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface NavigationHeaderProps {
  title: string
  onBack?: () => void
  showMenu?: boolean
  onMenuToggle?: () => void
  children?: React.ReactNode
}

export function NavigationHeader({ 
  title, 
  onBack, 
  showMenu = false, 
  onMenuToggle,
  children 
}: NavigationHeaderProps) {
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
    onMenuToggle?.()
  }

  return (
    <div className="sticky top-0 z-50 bg-card-custom border-b border-golden/20 shadow-lg">
      {/* Main Header */}
      <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Left Section - Back Button */}
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 sm:h-11 sm:w-11 text-golden hover:text-golden/80 hover:bg-golden/10 rounded-full transition-all duration-200"
            >
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}
        </div>

        {/* Center Section - Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-lg sm:text-xl font-bold text-golden leading-tight text-center">
            {title}
          </h1>
          {isMobile && (
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {children}
          
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMenuToggle}
              className="h-10 w-10 sm:h-11 sm:w-11 text-golden hover:text-golden/80 hover:bg-golden/10 rounded-full transition-all duration-200"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && isMenuOpen && isMobile && (
        <div className="absolute top-full left-0 right-0 bg-card-custom border-b border-golden/20 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {/* Add mobile menu items here if needed */}
          </div>
        </div>
      )}
    </div>
  )
}
