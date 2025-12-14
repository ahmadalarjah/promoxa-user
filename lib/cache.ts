/**
 * Client-side caching utility for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes
  private readonly maxSize = 100

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    const ttl = config.ttl || this.defaultTTL
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= (config.maxSize || this.maxSize)) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, entry)
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Check if data is cached and fresh
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Create global cache instance
export const cache = new CacheManager()

// Cache configuration presets
export const CACHE_CONFIG = {
  CHAT_MESSAGES: { ttl: 2 * 60 * 1000 }, // 2 minutes for chat messages
  USER_PROFILE: { ttl: 10 * 60 * 1000 }, // 10 minutes for user profile
  PLANS: { ttl: 30 * 60 * 1000 }, // 30 minutes for plans
  TRANSACTIONS: { ttl: 5 * 60 * 1000 }, // 5 minutes for transactions
  NOTIFICATIONS: { ttl: 1 * 60 * 1000 }, // 1 minute for notifications
  STATIC_DATA: { ttl: 60 * 60 * 1000 }, // 1 hour for static data
} as const

// Cache keys
export const CACHE_KEYS = {
  CHAT_MESSAGES: 'chat_messages',
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  PLANS: 'plans',
  TRANSACTIONS: (userId: string) => `transactions_${userId}`,
  NOTIFICATIONS: (userId: string) => `notifications_${userId}`,
  DASHBOARD_STATS: (userId: string) => `dashboard_stats_${userId}`,
} as const

export default cache
