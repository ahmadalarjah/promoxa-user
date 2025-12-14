"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  MessageCircle,
  Pin,
  Crown,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCache } from "@/contexts/CacheContext"
import { apiService } from "@/lib/api"
import { chatService } from "@/lib/websocket"
import { cache, CACHE_KEYS } from "@/lib/cache"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"
import CacheStatus from "@/components/CacheStatus"

interface ChatMessage {
  id: number
  username: string
  avatar?: string
  content: string
  created_at: string  // Changed from timestamp to created_at to match DB
  isAdmin: boolean
  isPinned: boolean
  reactions: { emoji: string; count: number; users: string[] }[]  // Added users array to track who reacted
}

interface PaginationInfo {
  page: number
  size: number
  total: number
  hasMore: boolean
}

export default function CommunityPage() {
  const { user } = useAuth()
  const { t, language, isRTL } = useLanguage()
  const { invalidateChatMessages } = useCache()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<number | null>(null)
  const [pinningMessage, setPinningMessage] = useState<number | null>(null)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'admin' | 'users'>('users') // Add tab state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 0,
    size: 20,
    total: 0,
    hasMore: true
  })
  const [showScrollTop, setShowScrollTop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Memoized messages for performance - sorted by oldest first with pinned messages at top
  const safeMessages = useMemo(() => {
    const messagesArray = Array.isArray(messages) ? messages : []
    
    // Separate admin and user messages
    const adminMessages = messagesArray.filter(msg => msg.isAdmin)
    const userMessages = messagesArray.filter(msg => !msg.isAdmin)
    
    // Separate pinned and unpinned messages for each type
    const pinnedAdminMessages = adminMessages.filter(msg => msg.isPinned)
    const unpinnedAdminMessages = adminMessages.filter(msg => !msg.isPinned)
    const pinnedUserMessages = userMessages.filter(msg => msg.isPinned)
    const unpinnedUserMessages = userMessages.filter(msg => !msg.isPinned)
    
    // Helper function to safely parse dates
    const parseDate = (dateString: string): number => {
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          // Invalid date string
          return 0 // Return epoch time for invalid dates
        }
        return date.getTime()
      } catch (error) {
        // Error parsing date
        return 0 // Return epoch time for invalid dates
      }
    }
    
    // Sort unpinned messages by oldest first (latest at bottom)
    const sortedUnpinnedAdminMessages = unpinnedAdminMessages.sort((a, b) => {
      const dateA = parseDate(a.created_at)
      const dateB = parseDate(b.created_at)
      return dateA - dateB
    })
    
    const sortedUnpinnedUserMessages = unpinnedUserMessages.sort((a, b) => {
      const dateA = parseDate(a.created_at)
      const dateB = parseDate(b.created_at)
      return dateA - dateB
    })
    
    // Sort pinned messages by oldest first (latest pinned at bottom)
    const sortedPinnedAdminMessages = pinnedAdminMessages.sort((a, b) => {
      const dateA = parseDate(a.created_at)
      const dateB = parseDate(b.created_at)
      return dateA - dateB
    })
    
    const sortedPinnedUserMessages = pinnedUserMessages.sort((a, b) => {
      const dateA = parseDate(a.created_at)
      const dateB = parseDate(b.created_at)
      return dateA - dateB
    })
    
    return {
      adminMessages: [...sortedPinnedAdminMessages, ...sortedUnpinnedAdminMessages],
      userMessages: [...sortedPinnedUserMessages, ...sortedUnpinnedUserMessages],
      allMessages: [...sortedPinnedAdminMessages, ...sortedPinnedUserMessages, ...sortedUnpinnedAdminMessages, ...sortedUnpinnedUserMessages]
    }
  }, [messages])

  // Chat message handler
  const handleChatMessage = useCallback((message: ChatMessage) => {
    // Received chat message
    
    // Normalize the message
    const normalizedMessage = {
      ...message,
      id: message.id || Math.random(),
      username: message.username || 'مستخدم غير معروف',
      content: message.content || '',
      created_at: message.created_at || new Date().toISOString(),
      isAdmin: message.isAdmin || false,
      isPinned: message.isPinned || false,
      reactions: Array.isArray(message.reactions) 
        ? message.reactions.map((reaction: any) => ({
            ...reaction,
            users: Array.isArray(reaction.users) ? reaction.users : []
          }))
        : []
    } as ChatMessage

    // Add new message to the list
    setMessages(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      
      // Check if message already exists
      const existingMessage = safePrev.find(msg => msg.id === normalizedMessage.id)
      if (existingMessage) {
        return safePrev // Don't add duplicate
      }
      
      const updatedMessages = [...safePrev, normalizedMessage]
      // Added new WebSocket message
      
      // Update last message ID
      setLastMessageId(normalizedMessage.id)
      
      // Invalidate chat messages cache since we have new real-time data
      invalidateChatMessages()
      
      return updatedMessages
    })
        
    // Auto-scroll to bottom for new messages if user is near bottom
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        if (isNearBottom) {
          scrollToBottom()
        }
      }
    }, 100)
  }, [])

  // Set up chat connection
  useEffect(() => {
    if (user?.username) {
      // Connect to chat service
      chatService.connectToCommunity(user.username, handleChatMessage)
      
      // Subscribe to connection status changes
      chatService.onConnectionChange((connected) => {
        setIsWebSocketConnected(connected)
      })
      
      // Set initial connection status
      setIsWebSocketConnected(chatService.isConnected())
    
      return () => {
        chatService.disconnect()
      }
    }
  }, [user?.username, handleChatMessage])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && pagination.hasMore && !loadingMore) {
            loadMoreMessages()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => observer.disconnect()
  }, [pagination.hasMore, loadingMore])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop } = messagesContainerRef.current
        setShowScrollTop(scrollTop > 300)
      }
    }

    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const loadMessages = async (reset = true, useCache = true) => {
    try {
      if (reset) {
        setLoading(true)
        setMessages([])
        setLastMessageId(null)
        setPagination(prev => ({ ...prev, page: 0, hasMore: true }))
      }

      const response = await apiService.getChatMessages(useCache)
      if (response.success && response.data) {
        // Handle both old and new response formats
        const responseData = response.data as any
        
        // Check if it's a Page object (new format) or direct array (old format)
        const messagesData = responseData.content 
          ? responseData.content 
          : Array.isArray(responseData) 
            ? responseData 
            : []
        
        const paginationData = responseData.pageable 
          ? { 
              total: responseData.totalElements || 0, 
              hasMore: !responseData.last 
            }
          : { total: 0, hasMore: false }
        
        const normalizedMessages = messagesData.map((message: any) => {
          // Ensure we have a proper timestamp
          let timestamp = message.createdAt || message.created_at
          if (!timestamp) {
            // Message missing timestamp
            timestamp = new Date().toISOString()
          }
          
          return {
            ...message,
            id: message.id || Math.random(),
            username: message.username || 'مستخدم غير معروف',
            content: message.content || '',
            created_at: timestamp,
            isAdmin: message.isAdminMessage || false,
            isPinned: message.isPinned || false,
            reactions: Array.isArray(message.reactions) 
              ? message.reactions.map((reaction: any) => ({
                  ...reaction,
                  users: Array.isArray(reaction.users) ? reaction.users : []
                }))
              : []
          }
        }) as ChatMessage[]

        if (reset) {
          setMessages(normalizedMessages)
          const latestMessageId = normalizedMessages.length > 0 ? Math.max(...normalizedMessages.map(m => m.id)) : 0
          setLastMessageId(latestMessageId)
        } else {
          setMessages(prev => [...prev, ...normalizedMessages])
        }
        
        setPagination(prev => ({
          ...prev,
          page: reset ? 1 : prev.page + 1,
          total: paginationData.total || 0,
          hasMore: paginationData.hasMore !== false
        }))
      } else {
        setError(t('community.loadError') || "فشل في تحميل الرسائل")
        if (reset) setMessages([])
      }
    } catch (error) {
      // Error loading messages
      console.error('Error loading messages:', error)
      setError(t('community.loadError') || "حدث خطأ أثناء تحميل الرسائل")
      if (reset) setMessages([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return
    
    setLoadingMore(true)
    await loadMessages(false)
  }, [loadingMore, pagination.hasMore])

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    // Check if user is trying to send admin message but is not admin
    if (activeTab === 'admin' && user?.role !== 'ADMIN') {
      setError('Only administrators can send admin messages')
      return
    }

    // Sending message via chat service
    setSending(true)
    try {
      // Send message via chat service
      await chatService.sendMessage(newMessage)
      
      // Clear input immediately for better UX
      setNewMessage("")
      
      // Clear any previous errors
      setError("")
      setSuccess(t('community.messageSent'))
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(""), 2000)
      
      // The message appears immediately for sender, others will see it within 1 second
      // Message sent! It appears immediately for sender.
      
    } catch (error: any) {
      // Error sending message
      console.error('Error sending message:', error)
      const errorMessage = error?.message || t('community.sendError')
      setError(errorMessage)
      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000)
    } finally {
      setSending(false)
    }
  }

  const addReaction = async (messageId: number, emoji: string) => {
    // Validate messageId
    if (!messageId || isNaN(messageId)) {
      // Invalid message ID for reaction
      return
    }

    // Check if user has already reacted to this emoji
    const currentUser = user?.username
    if (!currentUser) {
      // No current user found for reaction
      return
    }

    // Check if user already reacted to this specific emoji
    const hasUserReactedToThis = safeMessages.allMessages.find(msg => 
      msg.id === messageId
    )?.reactions?.find(reaction => 
      reaction.emoji === emoji && reaction.users?.includes(currentUser)
    )

    // Check if user has any reaction (like or dislike) on this message
    const userHasAnyReaction = safeMessages.allMessages.find(msg => 
      msg.id === messageId
    )?.reactions?.some(reaction => 
      reaction.users?.includes(currentUser)
    )

    try {
      const response = await apiService.addReaction(messageId, emoji)
      if (response.success) {
        // Handle the reaction toggle
        setMessages(prev => {
          const safePrev = Array.isArray(prev) ? prev : []
          return safePrev.map(msg => {
            if (msg.id === messageId) {
              // Ensure reactions array exists
              const reactions = msg.reactions || []
              const likeReaction = reactions.find(r => r.emoji === '👍')
              const dislikeReaction = reactions.find(r => r.emoji === '👎')
              
              if (hasUserReactedToThis) {
                // Remove user's reaction from this emoji
                const updatedReactions = reactions.map(r => {
                  if (r.emoji === emoji) {
                    const updatedUsers = r.users?.filter(u => u !== currentUser) || []
                    const newCount = Math.max(0, r.count - 1)
                    
                    if (newCount === 0) {
                      return null // Remove this reaction entirely
                    } else {
                      return { ...r, count: newCount, users: updatedUsers }
                    }
                  }
                  return r
                }).filter((r): r is { emoji: string; count: number; users: string[] } => r !== null) // Remove null entries
                
                return { ...msg, reactions: updatedReactions }
              } else {
                // Add user's reaction to this emoji
                let updatedReactions = [...reactions]
                
                // If user has another reaction, remove it first
                if (userHasAnyReaction) {
                  updatedReactions = reactions.map(r => {
                    const updatedUsers = r.users?.filter(u => u !== currentUser) || []
                    const newCount = Math.max(0, r.count - 1)
                    
                    if (newCount === 0) {
                      return null // Remove this reaction entirely
                    } else {
                      return { ...r, count: newCount, users: updatedUsers }
                    }
                  }).filter((r): r is { emoji: string; count: number; users: string[] } => r !== null) // Remove null entries
                }
                
                // Add new reaction
                const existingReaction = updatedReactions.find(r => r.emoji === emoji)
                if (existingReaction) {
                  updatedReactions = updatedReactions.map(r => 
                    r.emoji === emoji 
                      ? { 
                          ...r, 
                          count: r.count + 1,
                          users: [...(r.users || []), currentUser]
                        } 
                      : r
                  )
                } else {
                  updatedReactions.push({ 
                    emoji, 
                    count: 1, 
                    users: [currentUser] 
                  })
                }
                
                return { ...msg, reactions: updatedReactions }
              }
            }
            return msg
          })
        })
      } else {
        // Handle API error response
        // Reaction API returned error
        // Still toggle reaction locally for better UX
        toggleReactionLocally(messageId, emoji, !!hasUserReactedToThis, !!userHasAnyReaction)
      }
    } catch (error) {
      // Error adding reaction
      // Toggle reaction locally even if API fails (optimistic update)
      toggleReactionLocally(messageId, emoji, !!hasUserReactedToThis, !!userHasAnyReaction)
    }
  }

  const toggleReactionLocally = (messageId: number, emoji: string, hasUserReactedToThis: boolean, userHasAnyReaction: boolean) => {
    const currentUser = user?.username
    if (!currentUser) return

    setMessages(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.map(msg => {
        if (msg.id === messageId) {
          // Ensure reactions array exists
          const reactions = msg.reactions || []
          
          if (hasUserReactedToThis) {
            // Remove user's reaction from this emoji
            const updatedReactions = reactions.map(r => {
              if (r.emoji === emoji) {
                const updatedUsers = r.users?.filter(u => u !== currentUser) || []
                const newCount = Math.max(0, r.count - 1)
                
                if (newCount === 0) {
                  return null // Remove this reaction entirely
                } else {
                  return { ...r, count: newCount, users: updatedUsers }
                }
              }
              return r
            }).filter((r): r is { emoji: string; count: number; users: string[] } => r !== null) // Remove null entries
            
            return { ...msg, reactions: updatedReactions }
          } else {
            // Add user's reaction to this emoji
            let updatedReactions = [...reactions]
            
            // If user has another reaction, remove it first
            if (userHasAnyReaction) {
              updatedReactions = reactions.map(r => {
                const updatedUsers = r.users?.filter(u => u !== currentUser) || []
                const newCount = Math.max(0, r.count - 1)
                
                if (newCount === 0) {
                  return null // Remove this reaction entirely
                } else {
                  return { ...r, count: newCount, users: updatedUsers }
                }
              }).filter((r): r is { emoji: string; count: number; users: string[] } => r !== null) // Remove null entries
            }
            
            // Add new reaction
            const existingReaction = updatedReactions.find(r => r.emoji === emoji)
            if (existingReaction) {
              updatedReactions = updatedReactions.map(r => 
                r.emoji === emoji 
                  ? { 
                      ...r, 
                      count: r.count + 1,
                      users: [...(r.users || []), currentUser]
                    } 
                  : r
              )
            } else {
              updatedReactions.push({ 
                emoji, 
                count: 1, 
                users: [currentUser] 
              })
            }
            
            return { ...msg, reactions: updatedReactions }
          }
        }
        return msg
      })
    })
  }

  const pinMessage = async (messageId: number) => {
    if (!user) return
    
    setPinningMessage(messageId)
    try {
      const response = await apiService.pinMessage(messageId)
      if (response.success) {
        // Update message locally
        setMessages(prev => {
          const safePrev = Array.isArray(prev) ? prev : []
          return safePrev.map(msg => 
            msg.id === messageId ? { ...msg, isPinned: true } : msg
          )
        })
      } else {
        setError("فشل في تثبيت الرسالة")
      }
    } catch (error) {
      // Error pinning message
      setError("حدث خطأ أثناء تثبيت الرسالة")
    } finally {
      setPinningMessage(null)
    }
  }

  const unpinMessage = async (messageId: number) => {
    if (!user) return
    
    setPinningMessage(messageId)
    try {
      const response = await apiService.unpinMessage(messageId)
      if (response.success) {
        // Update message locally
        setMessages(prev => {
          const safePrev = Array.isArray(prev) ? prev : []
          return safePrev.map(msg => 
            msg.id === messageId ? { ...msg, isPinned: false } : msg
          )
        })
      } else {
        setError("فشل في إلغاء تثبيت الرسالة")
      }
    } catch (error) {
      // Error unpinning message
      setError("حدث خطأ أثناء إلغاء تثبيت الرسالة")
    } finally {
      setPinningMessage(null)
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return language === 'ar' ? 'وقت غير محدد' : 'Unknown time'
      }
      return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch (error) {
      // Error formatting time
      return language === 'ar' ? 'وقت غير محدد' : 'Unknown time'
    }
  }

  const getEmojiIcon = (emoji: string) => {
    switch (emoji) {
      case '👍': return <ThumbsUp className="w-3 h-3" />
      case '👎': return <ThumbsDown className="w-3 h-3" />
      default: return <span>{emoji}</span>
    }
  }

  useEffect(() => {
    loadMessages(true)
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Fixed Header Section */}
        <div className="flex flex-col">
          {/* Navigation Header */}
          <NavigationHeader 
            title={t('community.title')}
            onBack={() => window.history.back()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Invalidate cache and force fresh load
                invalidateChatMessages()
                loadMessages(true, false) // Don't use cache
              }}
              disabled={refreshing}
              className="text-golden hover:bg-golden/10 transition-colors"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </NavigationHeader>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 sm:p-4 mx-3 sm:mx-4 mt-3 sm:mt-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="text-red-400 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 sm:p-4 mx-3 sm:mx-4 mt-3 sm:mt-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-green-400 text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Real-time indicator */}
          <div className={`px-3 sm:px-4 py-2 border-b transition-colors ${
            isWebSocketConnected 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isWebSocketConnected ? (
                  <>
                    <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-green-400 text-xs font-medium">
                      {t('community.online')} - {t('community.realTime')}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-400 text-xs font-medium">
                      {t('community.connecting')}...
                    </span>
                  </>
                )}
              </div>
              <CacheStatus />
            </div>
          </div>
        </div>

        {/* Tab Navigation - Fixed Sticky */}
        <div className="sticky top-0 z-50 px-3 sm:px-4 pt-2 pb-2 bg-gradient-to-b from-gray-900/95 to-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
          <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-700/50">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 font-medium text-sm ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-golden to-orange-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('community.userMessages')}</span>
              <Badge variant="secondary" className="ml-1 bg-gray-600/50 text-gray-300 text-xs">
                {safeMessages.userMessages.length}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{t('community.adminMessages')}</span>
              <Badge variant="secondary" className="ml-1 bg-gray-600/50 text-gray-300 text-xs">
                {safeMessages.adminMessages.length}
              </Badge>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 relative mobile-scroll"
        >
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 text-golden animate-spin" />
                <p className="text-gray-400 text-sm">{t('community.loading')}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {!loading && safeMessages.allMessages.length === 0 ? (
            <div className="text-center text-gray-400 mt-16">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-2">{t('community.noMessages')}</p>
              <p className="text-sm">{t('community.chat')}</p>
            </div>
          ) : (
            <>
              {/* Pinned Messages Section - Show only if there are pinned messages in the active tab */}
              {(() => {
                const pinnedMessages = activeTab === 'admin' 
                  ? safeMessages.adminMessages.filter(msg => msg.isPinned)
                  : safeMessages.userMessages.filter(msg => msg.isPinned)
                
                if (pinnedMessages.length === 0) return null
                
                return (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-3 px-2">
                      <Pin className="w-4 h-4 text-golden" />
                      <span className="text-golden text-sm font-medium">{t('community.pinned')}</span>
                      <span className="text-gray-400 text-xs">
                        ({pinnedMessages.length}/2)
                      </span>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {pinnedMessages.map((message) => (
                      <div
                        key={`pinned-${message.id}`}
                        className="flex justify-start"
                      >
                        <div className="max-w-xs lg:max-w-md w-full">
                          {/* Pinned Message Card */}
                          <Card className="p-4 sm:p-5 bg-gradient-to-br from-golden/15 via-orange-500/10 to-yellow-500/5 border-2 border-golden/40 shadow-2xl shadow-golden/20 rounded-2xl sm:rounded-3xl relative overflow-hidden backdrop-blur-sm">
                            
                            {/* Pinned Badge */}
                            <div className={`absolute top-2 sm:top-3 ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'}`}>
                              <Badge className="bg-gradient-to-r from-golden/30 to-orange-500/30 text-golden border-golden/50 text-xs px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg backdrop-blur-sm">
                                <Pin className="w-3 h-3 mr-1" />
                                مثبت
                              </Badge>
                            </div>

                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                                  message.isAdmin 
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400/50' 
                                    : 'bg-gradient-to-br from-gray-600 to-gray-500'
                                }`}>
                                  <span className="text-white text-xs sm:text-sm font-bold">
                                    {message.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-100 truncate">
                                      {message.username || t('common.unknown')}
                                    </span>
                                    {message.isAdmin && (
                                      <div className="flex items-center space-x-1 flex-shrink-0">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-blue-300 font-medium">Admin</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {formatTime(message.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="mb-3 sm:mb-4">
                              <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {message.content}
                              </p>
                            </div>

                            {/* Reactions Display */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                {message.reactions.map((reaction, index) => (
                                  <div
                                    key={`pinned-${reaction.emoji}-${index}`}
                                    className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-gray-700/60 to-gray-600/60 rounded-full text-xs border border-gray-500/40 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200"
                                  >
                                    <span className="text-base sm:text-lg">{reaction.emoji}</span>
                                    <span className="text-gray-200 font-semibold text-xs">{reaction.count}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reaction Buttons */}
                            <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-3 border-t border-gray-600/40">
                              {['👍', '👎'].map((emoji) => {
                                const currentUser = user?.username
                                const hasUserReacted = message.reactions?.find(reaction => 
                                  reaction.emoji === emoji && reaction.users?.includes(currentUser || '')
                                )
                                
                                return (
                                  <button
                                    key={`pinned-${emoji}`}
                                    onClick={() => addReaction(message.id, emoji)}
                                    className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 hover:scale-105 touch-manipulation ${
                                      hasUserReacted 
                                        ? 'bg-gradient-to-r from-golden/30 to-orange-500/30 text-golden border-2 border-golden/50 shadow-lg shadow-golden/20' 
                                        : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 border-2 border-gray-600/50 hover:bg-gradient-to-r hover:from-gray-600/60 hover:to-gray-500/60 hover:border-gray-500/60 hover:shadow-lg'
                                    }`}
                                    title={hasUserReacted ? t('community.removeReaction') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                                  >
                                    <span className="text-lg sm:text-xl">{emoji}</span>
                                    <span className="text-sm font-medium">
                                      {hasUserReacted ? t('community.reacted') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                                    </span>
                                  </button>
                                )
                              })}
                              
                              {/* Admin Pin/Unpin Button - Only for admin users */}
                              {user && user.role === 'ADMIN' && (
                                <button
                                  onClick={() => message.isPinned ? unpinMessage(message.id) : pinMessage(message.id)}
                                  disabled={pinningMessage === message.id}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                                    message.isPinned
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                                  }`}
                                  title={message.isPinned ? t('community.unpin') : t('community.pin')}
                                >
                                  {pinningMessage === message.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {message.isPinned ? t('community.unpin') : t('community.pin')}
                                  </span>
                                </button>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
              })()}

              {/* Admin Messages Section - Show only when admin tab is active */}
              {activeTab === 'admin' && safeMessages.adminMessages.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  {safeMessages.adminMessages.map((message) => (
                      <div
                        key={`admin-${message.id}`}
                        className="flex justify-start"
                      >
                        <div className="max-w-xs lg:max-w-md w-full">
                          {/* Admin Message Card */}
                          <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-indigo-500/5 border-2 border-blue-400/40 shadow-2xl shadow-blue-500/20 rounded-2xl sm:rounded-3xl relative overflow-hidden backdrop-blur-sm">
                            
                            {/* Admin Badge */}
                            <div className={`absolute top-2 sm:top-3 ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'}`}>
                              <Badge className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-300 border-blue-400/50 text-xs px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg backdrop-blur-sm">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            </div>

                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400/50">
                                  <span className="text-white text-xs sm:text-sm font-bold">
                                    {message.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-100 truncate">
                                      {message.username || t('common.unknown')}
                                    </span>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-blue-300 font-medium">Admin</span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {formatTime(message.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="mb-3 sm:mb-4">
                              <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {message.content}
                              </p>
                            </div>

                            {/* Reactions Display */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                {message.reactions.map((reaction, index) => (
                                  <div
                                    key={`admin-${reaction.emoji}-${index}`}
                                    className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-gray-700/60 to-gray-600/60 rounded-full text-xs border border-gray-500/40 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200"
                                  >
                                    <span className="text-base sm:text-lg">{reaction.emoji}</span>
                                    <span className="text-gray-200 font-semibold text-xs">{reaction.count}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reaction Buttons */}
                            <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-3 border-t border-gray-600/40">
                              {['👍', '👎'].map((emoji) => {
                                const currentUser = user?.username
                                const hasUserReacted = message.reactions?.find(reaction => 
                                  reaction.emoji === emoji && reaction.users?.includes(currentUser || '')
                                )
                                
                                return (
                                  <button
                                    key={`admin-${emoji}`}
                                    onClick={() => addReaction(message.id, emoji)}
                                    className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 hover:scale-105 touch-manipulation ${
                                      hasUserReacted 
                                        ? 'bg-gradient-to-r from-golden/30 to-orange-500/30 text-golden border-2 border-golden/50 shadow-lg shadow-golden/20' 
                                        : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 border-2 border-gray-600/50 hover:bg-gradient-to-r hover:from-gray-600/60 hover:to-gray-500/60 hover:border-gray-500/60 hover:shadow-lg'
                                    }`}
                                    title={hasUserReacted ? t('community.removeReaction') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                                  >
                                    <span className="text-lg sm:text-xl">{emoji}</span>
                                    <span className="text-sm font-medium">
                                      {hasUserReacted ? t('community.reacted') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                                    </span>
                                  </button>
                                )
                              })}
                              
                              {/* Admin Pin/Unpin Button - Only for admin users */}
                              {user && user.role === 'ADMIN' && (
                                <button
                                  onClick={() => message.isPinned ? unpinMessage(message.id) : pinMessage(message.id)}
                                  disabled={pinningMessage === message.id}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                                    message.isPinned
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                                  }`}
                                  title={message.isPinned ? t('community.unpin') : t('community.pin')}
                                >
                                  {pinningMessage === message.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {message.isPinned ? t('community.unpin') : t('community.pin')}
                                  </span>
                                </button>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* User Messages Section - Show only when users tab is active */}

              {/* User Messages Section - Show only when users tab is active */}
              {activeTab === 'users' && (
                <div className="space-y-4 sm:space-y-6">
                  {safeMessages.userMessages.map((message) => (
                  <div
                    key={message.id || `message-${message.created_at}-${Math.random()}`}
                    className="flex justify-start"
                  >
                    <div className={`max-w-xs lg:max-w-md w-full ${
                      message.username === user?.username ? 'ml-auto' : ''
                    }`}>
                      {/* Message Card */}
                      <Card className={`p-4 sm:p-5 ${
                        message.username === user?.username
                          ? 'bg-gradient-to-br from-golden/20 via-orange-500/15 to-yellow-500/10 border-2 border-golden/40 shadow-2xl shadow-golden/20'
                          : message.isAdmin
                            ? 'bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-indigo-500/5 border-2 border-blue-400/40 shadow-2xl shadow-blue-500/20'
                            : 'bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-600/70 border-2 border-gray-600/40 shadow-2xl shadow-gray-900/30'
                      } rounded-2xl sm:rounded-3xl relative overflow-hidden backdrop-blur-sm`}>

                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                              message.isAdmin 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400/50' 
                                : message.username === user?.username
                                  ? 'bg-gradient-to-br from-golden to-orange-500 ring-2 ring-golden/50'
                                  : 'bg-gradient-to-br from-gray-600 to-gray-500'
                            }`}>
                              <span className="text-white text-xs sm:text-sm font-bold">
                                {message.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-100 truncate">
                                  {message.username || t('common.unknown')}
                                </span>
                                {message.isAdmin && (
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-blue-300 font-medium">Admin</span>
                                  </div>
                                )}
                                {message.username === user?.username && (
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <div className="w-1.5 h-1.5 bg-golden rounded-full animate-pulse"></div>
                                    <span className="text-xs text-golden font-medium">You</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="mb-3 sm:mb-4">
                          <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {message.content}
                          </p>
                        </div>

                        {/* Reactions Display */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                            {message.reactions.map((reaction, index) => (
                              <div
                                key={`${reaction.emoji}-${index}`}
                                className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-gray-700/60 to-gray-600/60 rounded-full text-xs border border-gray-500/40 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200"
                              >
                                <span className="text-base sm:text-lg">{reaction.emoji}</span>
                                <span className="text-gray-200 font-semibold text-xs">{reaction.count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reaction Buttons */}
                        <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-3 border-t border-gray-600/40">
                          {['👍', '👎'].map((emoji) => {
                            const currentUser = user?.username
                            const hasUserReacted = message.reactions?.find(reaction => 
                              reaction.emoji === emoji && reaction.users?.includes(currentUser || '')
                            )
                            
                            return (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 hover:scale-105 touch-manipulation ${
                                  hasUserReacted 
                                    ? 'bg-gradient-to-r from-golden/30 to-orange-500/30 text-golden border-2 border-golden/50 shadow-lg shadow-golden/20' 
                                    : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 border-2 border-gray-600/50 hover:bg-gradient-to-r hover:from-gray-600/60 hover:to-gray-500/60 hover:border-gray-500/60 hover:shadow-lg'
                                }`}
                                title={hasUserReacted ? t('community.removeReaction') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                              >
                                <span className="text-lg sm:text-xl">{emoji}</span>
                                <span className="text-sm font-medium">
                                  {hasUserReacted ? t('community.reacted') : emoji === '👍' ? t('community.like') : t('community.dislike')}
                                </span>
                              </button>
                            )
                          })}
                          
                          {/* Admin Pin/Unpin Button - Only for admin users */}
                          {user && user.role === 'ADMIN' && (
                            <button
                              onClick={() => message.isPinned ? unpinMessage(message.id) : pinMessage(message.id)}
                              disabled={pinningMessage === message.id}
                              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 hover:scale-105 touch-manipulation ${
                                message.isPinned
                                  ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300 border-2 border-red-500/50 shadow-lg shadow-red-500/20 hover:from-red-500/40 hover:to-pink-500/40'
                                  : 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 hover:from-blue-500/40 hover:to-indigo-500/40'
                              }`}
                              title={message.isPinned ? t('community.unpin') : t('community.pin')}
                            >
                              {pinningMessage === message.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Pin className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {message.isPinned ? t('community.unpin') : t('community.pin')}
                              </span>
                            </button>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                ))}
                </div>
              )}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div ref={loadingRef} className="flex items-center justify-center py-6">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-golden animate-spin" />
                    <span className="text-gray-400 text-sm">{t('community.loadingMore')}</span>
                  </div>
                </div>
              )}

              {/* End of messages marker */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 p-3 bg-golden/20 hover:bg-golden/30 text-golden rounded-full transition-all duration-200 backdrop-blur-sm border border-golden/30 shadow-lg z-10"
            title={t('community.scrollToTop')}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}

        {/* Message Input */}
        <div className="sticky bottom-0 p-3 sm:p-4 border-t border-gray-700/50 bg-black/20 backdrop-blur-sm pb-safe z-40">
          {activeTab === 'admin' ? (
            // Admin messages tab - only admins can send messages
            user?.role === 'ADMIN' ? (
              <div className="flex space-x-2 sm:space-x-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={t('community.enterAdminMessage') || 'Type admin message...'}
                  className="flex-1 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200 text-sm sm:text-base"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg touch-target"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 bg-gray-800/30 border border-gray-600/30 rounded-xl">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {t('community.adminOnlyMessages') || 'Only administrators can send admin messages'}
                  </span>
                </div>
              </div>
            )
          ) : (
            // User messages tab - all users can send messages
            <div className="flex space-x-2 sm:space-x-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t('community.enterMessage')}
                className="flex-1 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 rounded-xl focus:border-golden/50 focus:ring-golden/20 transition-all duration-200 text-sm sm:text-base"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-golden to-orange-500 hover:from-golden/90 hover:to-orange-500/90 text-black font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg touch-target"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
