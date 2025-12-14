import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { CacheProvider } from "@/contexts/CacheContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "PROMOXA - منصة العملات الرقمية",
  description: "منصة شاملة لإدارة العملات الرقمية والاستثمار",
  generator: "v0.app",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="min-h-screen bg-[#1a1a1a] text-white antialiased">
        <CacheProvider>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </CacheProvider>
      </body>
    </html>
  )
}
