"use client"

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { cache, CACHE_KEYS } from '@/lib/cache'

interface CacheContextType {
  // Cache management functions
  invalidateCache: (key: string) => void
  invalidateUserData: () => void
  invalidateAllCache: () => void
  getCacheStats: () => { size: number; entries: string[] }
  
  // Specific cache invalidation functions
  invalidateChatMessages: () => void
  invalidateUserProfile: () => void
  invalidatePlans: () => void
  invalidateNotifications: () => void
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

export function CacheProvider({ children }: { children: ReactNode }) {
  // Generic cache invalidation
  const invalidateCache = useCallback((key: string) => {
    cache.invalidate(key)
    // Invalidated cache for key: ${key}
  }, [])

  // Invalidate all user-related data
  const invalidateUserData = useCallback(() => {
    cache.invalidatePattern('user_.*')
    cache.invalidatePattern('.*_current')
    // Invalidated all user data cache
  }, [])

  // Clear all cache
  const invalidateAllCache = useCallback(() => {
    cache.clear()
    // Cleared all cache
  }, [])

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return cache.getStats()
  }, [])

  // Specific cache invalidation functions
  const invalidateChatMessages = useCallback(() => {
    cache.invalidate(CACHE_KEYS.CHAT_MESSAGES)
    // Invalidated chat messages cache
  }, [])

  const invalidateUserProfile = useCallback(() => {
    cache.invalidate(CACHE_KEYS.USER_PROFILE('current'))
    // Invalidated user profile cache
  }, [])

  const invalidatePlans = useCallback(() => {
    cache.invalidate(CACHE_KEYS.PLANS)
    // Invalidated plans cache
  }, [])

  const invalidateNotifications = useCallback(() => {
    cache.invalidate(CACHE_KEYS.NOTIFICATIONS('current'))
    // Invalidated notifications cache
  }, [])

  const value: CacheContextType = {
    invalidateCache,
    invalidateUserData,
    invalidateAllCache,
    getCacheStats,
    invalidateChatMessages,
    invalidateUserProfile,
    invalidatePlans,
    invalidateNotifications,
  }

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}

export default CacheContext
