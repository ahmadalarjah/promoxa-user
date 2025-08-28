"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCache } from '@/contexts/CacheContext'
import { Database, Trash2, RefreshCw } from 'lucide-react'

interface CacheStatusProps {
  showDetails?: boolean
  className?: string
}

export default function CacheStatus({ showDetails = false, className = '' }: CacheStatusProps) {
  const { getCacheStats, invalidateAllCache } = useCache()
  const [stats, setStats] = useState({ size: 0, entries: [] as string[] })
  const [isOpen, setIsOpen] = useState(false)

  const updateStats = () => {
    setStats(getCacheStats())
  }

  useEffect(() => {
    updateStats()
    
    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    invalidateAllCache()
    updateStats()
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-gray-400 ${className}`}>
        <Database className="w-3 h-3" />
        <span>Cache: {stats.size} entries</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-300"
      >
        <Database className="w-4 h-4 mr-2" />
        Cache ({stats.size})
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 p-4 bg-gray-800 border-gray-700 z-50 min-w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Cache Status</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={updateStats}
                className="text-gray-400 hover:text-gray-300"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-300">
              <p>Total entries: {stats.size}</p>
            </div>

            {stats.entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Cached Keys:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {stats.entries.map((key, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded font-mono"
                    >
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-700">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                className="w-full"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Clear All Cache
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
