"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService, User, isAuthenticated } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (usernameOrPhone: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (userData: any) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      // Check for demo mode first
      const isDemoMode = localStorage.getItem('demo_mode') === 'true'
      if (isDemoMode) {
        const demoUser = localStorage.getItem('demo_user')
        if (demoUser) {
          setUser(JSON.parse(demoUser))
          setLoading(false)
          return
        }
      }

      if (isAuthenticated()) {
        const response = await apiService.getProfile(false) // Don't use cache to get fresh data
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // Token might be invalid, logout
          // Token invalid, logging out
          logout()
        }
      }
    } catch (error) {
              // Error refreshing user
      // Don't logout on network errors, just set loading to false
      if (error instanceof Error && error.message.includes('Backend server is not available')) {
                  // Backend not available, keeping user logged in
      } else {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (usernameOrPhone: string, password: string) => {
    try {
      const response = await apiService.login({ usernameOrPhone, password })
      
      if (response.success && response.data) {
        setUser(response.data.user)
        router.push('/home')
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.error || 'Login failed' 
        }
      }
    } catch (error) {
              // Login error occurred
      return { 
        success: false, 
        message: 'Network error occurred. Please check if the backend is running.' 
      }
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await apiService.register(userData)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        router.push('/home')
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.error || 'Registration failed' 
        }
      }
    } catch (error) {
              // Registration error occurred
      return { 
        success: false, 
        message: 'Network error occurred. Please check if the backend is running.' 
      }
    }
  }

  const logout = () => {
    // Clear demo mode
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_user')
    
    apiService.logout()
    setUser(null)
    router.push('/login')
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
