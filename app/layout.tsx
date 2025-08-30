import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { CacheProvider } from "@/contexts/CacheContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "SMART DIGITAL PROMOTION PLATFORM",
  description: "Advanced digital promotion platform with AI-powered features",
  generator: "v0.app",
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
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </CacheProvider>
      </body>
    </html>
  )
}
