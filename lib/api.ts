import { cache, CACHE_CONFIG, CACHE_KEYS } from './cache'

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.promoxa.org/api'

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Backend Response Types (direct responses)
export interface AuthResponse {
  token: string
  type: string
  user: User
}

export interface LoginRequest {
  usernameOrPhone: string
  password: string
}

export interface RegisterRequest {
  username: string
  fullName: string
  referralCode: string
  phoneNumber: string
  email?: string
  password: string
  confirmPassword: string
  walletAddress: string
}

export interface User {
  id: number
  username: string
  fullName: string
  phoneNumber: string
  email?: string
  referralCode: string
  currentPlan?: Plan
  walletAddress?: string
  totalBalance: number
  withdrawableAmount: number
  totalProfit: number
  referralEarnings: number
  dailyEarnings: number
  totalEarnings: number
  frozenBalance: number
  role?: 'USER' | 'ADMIN'
}

export interface Plan {
  id: number
  name: string
  price: string
  minDailyEarning: string
  maxDailyEarning: string
  canPurchase?: boolean
}

export interface DailyOrder {
  id: number
  description: string
  descriptionKey?: string // Translation key for localization
  earningAmount: number
  completedAt: string
  orderNumber: number
  completed: boolean
}

export interface TeamMember {
  id: number
  fullName: string
  depositAmount: number
  isDirect: boolean
  joinDate: string
}

export interface Deposit {
  id: number
  amount: number
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
  confirmedAt?: string
}

export interface Withdrawal {
  id: number
  requestedAmount: number
  finalAmount: number
  feeAmount: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  walletAddress?: string
  adminNotes?: string
  transactionHash?: string
  username?: string
}

export interface SupportTicket {
  id: number
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  closedAt?: string
  userName: string
  username: string
  messages: SupportMessage[]
}

export interface SupportMessage {
  id: number
  content: string
  isFromAdmin: boolean
  senderName: string
  createdAt: string
}

export interface UserPromoCode {
  id: number
  code: string
  type: string
  bonusAmount?: number
  activatesAccount: boolean
  usageLimit: number
  usedCount: number
  expiresAt?: string
  usedAt: string
  isActive: boolean
}

export interface ChatMessage {
  id: number
  username: string
  avatar?: string
  content: string
  timestamp: string
  isAdminMessage: boolean
  reactions?: MessageReaction[]
}

export interface MessageReaction {
  emoji: string
  count: number
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'DEPOSIT_APPROVED' | 'DEPOSIT_REJECTED' | 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED' | 'SYSTEM_MESSAGE' | 'PLAN_PURCHASED' | 'REFERRAL_BONUS' | 'DAILY_EARNINGS' | 'ADMIN_MESSAGE' | 'FIRST_DEPOSIT_BONUS'
  isRead: boolean
  createdAt: string
  readAt?: string
  relatedEntityType?: string
  relatedEntityId?: number
}

export interface SupportMessage {
  id: number
  content: string
  timestamp: string
  isUser: boolean
  isRead: boolean
}

// API Service Class
class ApiService {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      // API request to: ${url}
      
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      })

      // Handle network errors
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = 'API request failed'
        let errorData: any = {}
        
        try {
          errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        // Handle ban response (403 Forbidden with USER_BANNED error)
        if (response.status === 403 && errorData.error === 'USER_BANNED') {
          // Clear authentication
          this.logout()
          
          // Show ban message
          const banMessage = `تم حظر حسابك. السبب: ${errorData.banReason || 'غير محدد'}`
          if (typeof window !== 'undefined') {
            alert(banMessage)
          }
          
          return {
            success: false,
            error: banMessage
          }
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      // Try to parse successful response
      try {
        const data = await response.json()
        return {
          success: true,
          data: data
        }
      } catch (parseError) {
        // Error parsing response
        return {
          success: false,
          error: 'Invalid response format'
        }
      }
    } catch (error) {
              // API Error occurred
      
      // Handle specific network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Backend server is not available. Please check if the backend is running.'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Authentication - Handle direct backend responses
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const url = `${API_BASE_URL}/auth/login`
      // Making login request
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        let errorMessage = 'Login failed'
        let errorData: any = {}
        
        try {
          errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        // Handle ban response during login
        if (response.status === 401 && errorMessage.includes('banned')) {
          // Clear any existing authentication
          this.logout()
          
          // Show ban message
          const banMessage = `تم حظر حسابك. السبب: ${errorMessage.replace('Account is banned. Reason: ', '')}`
          if (typeof window !== 'undefined') {
            alert(banMessage)
          }
          
          return {
            success: false,
            error: banMessage
          }
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      const authResponse: AuthResponse = await response.json()
      
      if (authResponse.token) {
        this.token = authResponse.token
        localStorage.setItem('auth_token', authResponse.token)
      }

      return {
        success: true,
        data: {
          token: authResponse.token,
          user: authResponse.user
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Invalid response format'
      }
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const url = `${API_BASE_URL}/auth/register`
      // Making register request
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        let errorMessage = 'Registration failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      const authResponse: AuthResponse = await response.json()
      
      if (authResponse.token) {
        this.token = authResponse.token
        localStorage.setItem('auth_token', authResponse.token)
        
        return {
          success: true,
          data: {
            token: authResponse.token,
            user: authResponse.user
          }
        }
      } else {
        return {
          success: false,
          error: 'Invalid response format'
        }
      }
    } catch (error) {
              // Register API Error occurred
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Backend server is not available. Please check if the backend is running.'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async forgotPassword(identifier: string, method: 'email' | 'phone'): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, method }),
    })
  }

  async logout(): Promise<void> {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  // User Profile
  async getProfile(useCache: boolean = true): Promise<ApiResponse<User>> {
    const cacheKey = CACHE_KEYS.USER_PROFILE('current')
    
    // Check cache first if enabled
    if (useCache && cache.has(cacheKey)) {
      const cachedData = cache.get<ApiResponse<User>>(cacheKey)
      if (cachedData) {
        // Using cached user profile
        return cachedData
      }
    }
    
    // Fetch from API
            // Fetching user profile from API
    const response = await this.request<User>('/user/profile')
    
    // Cache successful responses
    if (response.success && useCache) {
      cache.set(cacheKey, response, CACHE_CONFIG.USER_PROFILE)
              // Cached user profile
    }
    
    return response
  }

  async recalculateWithdrawableAmount(): Promise<ApiResponse<any>> {
    return this.request<any>('/user/recalculate-withdrawable', {
      method: 'POST',
    })
  }

  async debugBalance(): Promise<ApiResponse<any>> {
    return this.request<any>('/user/debug-balance')
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    
    // Invalidate user profile cache when profile is updated
    if (response.success) {
      cache.invalidate(CACHE_KEYS.USER_PROFILE('current'))
    }
    
    return response
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  }

  // Dashboard - Fixed endpoint
  async getDashboardStats(): Promise<ApiResponse<{
    totalBalance: number
    referralEarnings: number
    dailyEarnings: number
    totalEarnings: number
  }>> {
    return this.request('/user/dashboard')
  }

  // Plans - Fixed endpoints
  async getPlans(useCache: boolean = true): Promise<ApiResponse<Plan[]>> {
    const cacheKey = CACHE_KEYS.PLANS
    
    // Check cache first if enabled
    if (useCache && cache.has(cacheKey)) {
      const cachedData = cache.get<ApiResponse<Plan[]>>(cacheKey)
      if (cachedData) {
        // Using cached plans
        return cachedData
      }
    }
    
    // Fetch from API
            // Fetching plans from API
    const response = await this.request<Plan[]>('/plans')
    
    // Cache successful responses
    if (response.success && useCache) {
      cache.set(cacheKey, response, CACHE_CONFIG.PLANS)
              // Cached plans
    }
    
    return response
  }

  async purchasePlan(planId: number): Promise<ApiResponse<{ message: string; success: boolean }>> {
    return this.request<{ message: string; success: boolean }>(`/plans/${planId}/purchase`, {
      method: 'POST',
    })
  }

  // Daily Orders - Fixed endpoints
  async getDailyOrders(): Promise<ApiResponse<DailyOrder[]>> {
    return this.request<DailyOrder[]>('/orders/status')
  }

  async completeOrder(taskId: number): Promise<ApiResponse<DailyOrder>> {
    return this.request<DailyOrder>(`/orders/complete/${taskId}`, {
      method: 'POST',
    })
  }

  async debugTasks(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/debug')
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/health')
  }

  async generateTasks(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/generate-tasks', {
      method: 'POST',
    })
  }

  async refreshDailyTasks(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/refresh-daily-tasks', {
      method: 'POST',
    })
  }

  async testDatabase(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/test-db')
  }

  async fixDatabase(): Promise<ApiResponse<any>> {
    return this.request<any>('/orders/fix-db', {
      method: 'POST',
    })
  }

  async getTodayOrders(): Promise<ApiResponse<DailyOrder[]>> {
    return this.request<DailyOrder[]>('/orders/today')
  }

  async getThisWeekOrders(): Promise<ApiResponse<DailyOrder[]>> {
    return this.request<DailyOrder[]>('/orders/this-week')
  }

  // Team - Fixed endpoints
  async getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
    const response = await this.request<{
      directReferrals: TeamMember[]
      indirectReferrals: TeamMember[]
      totalTeamSize: number
      totalReferralEarnings: number
    }>('/team/stats')
    
    if (response.success && response.data) {
      // Combine direct and indirect referrals into a single array with isDirect flag
      const allMembers: TeamMember[] = [
        ...(response.data.directReferrals || []).map(member => ({ ...member, isDirect: true })),
        ...(response.data.indirectReferrals || []).map(member => ({ ...member, isDirect: false }))
      ]
      return { success: response.success, data: allMembers, message: response.message }
    }
    return { success: false, data: [], message: 'Failed to load team members' }
  }

  async getTeamStats(): Promise<ApiResponse<{
    totalMembers: number
    directMembers: number
    indirectMembers: number
    totalEarnings: number
  }>> {
    const response = await this.request<{
      directReferrals: TeamMember[]
      indirectReferrals: TeamMember[]
      totalTeamSize: number
      totalReferralEarnings: number
    }>('/team/stats')
    
    if (response.success && response.data) {
      return {
        success: response.success,
        data: {
          totalMembers: response.data.totalTeamSize || 0,
          directMembers: response.data.directReferrals?.length || 0,
          indirectMembers: response.data.indirectReferrals?.length || 0,
          totalEarnings: parseFloat(response.data.totalReferralEarnings?.toString() || '0') || 0
        },
        message: response.message
      }
    }
    return { 
      success: false, 
      data: { totalMembers: 0, directMembers: 0, indirectMembers: 0, totalEarnings: 0 }, 
      message: 'Failed to load team stats' 
    }
  }

  // Deposits - Fixed endpoints
  async getDeposits(): Promise<ApiResponse<Deposit[]>> {
    return this.request<Deposit[]>('/deposit/history')
  }

  async getDepositInfo(): Promise<ApiResponse<{
    address: string
    minAmount: number
    network: string
  }>> {
    return this.request<{
      address: string
      minAmount: number
      network: string
    }>('/deposit/info')
  }

  async createDeposit(amount: number, transactionHash?: string): Promise<ApiResponse<{ depositAddress: string }>> {
    const body: any = { amount }
    if (transactionHash) {
      body.transactionHash = transactionHash
    }
    
    return this.request<{ depositAddress: string }>('/deposit', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async confirmDeposit(depositId: number, transactionHash: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/deposit/${depositId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ transactionHash }),
    })
  }

  async checkFirstDepositEligibility(): Promise<ApiResponse<{ eligible: boolean; hasFirstDeposit: boolean }>> {
    return this.request<{ eligible: boolean; hasFirstDeposit: boolean }>('/deposit/first-deposit-eligible')
  }

  // Withdrawals - Fixed endpoints
  async getWithdrawals(): Promise<ApiResponse<Withdrawal[]>> {
    return this.request<Withdrawal[]>('/withdrawal/history')
  }

  async createWithdrawal(amount: number): Promise<ApiResponse<void>> {
    return this.request<void>('/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  // Promo Codes
  async activatePromoCode(code: string): Promise<ApiResponse<{ message: string; success: boolean }>> {
    return this.request<{ message: string; success: boolean }>('/promo/activate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async getUserPromoCodes(): Promise<ApiResponse<UserPromoCode[]>> {
    return this.request<UserPromoCode[]>('/promo/my-codes')
  }

  async checkPromoCodeUsed(code: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>(`/promo/check/${code}`)
  }

  // Community Chat - Fixed endpoints
  async getChatMessages(useCache: boolean = true): Promise<ApiResponse<ChatMessage[]>> {
    const cacheKey = CACHE_KEYS.CHAT_MESSAGES
    
    // Check cache first if enabled
    if (useCache && cache.has(cacheKey)) {
      const cachedData = cache.get<ApiResponse<ChatMessage[]>>(cacheKey)
      if (cachedData) {
        // Using cached chat messages
        return cachedData
      }
    }
    
    // Fetch from API
            // Fetching chat messages from API
    const response = await this.request<ChatMessage[]>('/community/messages?page=0&size=50')
    
    // Cache successful responses
    if (response.success && useCache) {
      cache.set(cacheKey, response, CACHE_CONFIG.CHAT_MESSAGES)
              // Cached chat messages
    }
    
    return response
  }

  async sendChatMessage(content: string): Promise<ApiResponse<ChatMessage>> {
    const response = await this.request<ChatMessage>('/community/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    
    // Invalidate chat messages cache when new message is sent
    if (response.success) {
      cache.invalidate(CACHE_KEYS.CHAT_MESSAGES)
              // Invalidated chat messages cache due to new message
    }
    
    return response
  }

  async addReaction(messageId: number, emoji: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/community/messages/${messageId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ reaction: emoji }),
    })
  }

  async pinMessage(messageId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/community/messages/${messageId}/pin`, {
      method: 'POST',
    })
  }

  async unpinMessage(messageId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/community/messages/${messageId}/pin`, {
      method: 'DELETE',
    })
  }

  // Support Tickets
  async getSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    return this.request<SupportTicket[]>('/support/tickets')
  }

  async createSupportTicket(subject: string, description: string): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, description }),
    })
  }

  async getSupportTicket(ticketId: number): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/tickets/${ticketId}`)
  }

  async sendTicketMessage(ticketId: number, content: string): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  // Admin Support Methods
  async getAllSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    return this.request<SupportTicket[]>('/support/admin/tickets')
  }

  async updateTicketStatus(ticketId: number, status: string): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/admin/tickets/${ticketId}/status?status=${status}`, {
      method: 'PUT',
    })
  }

  // Notifications - These might not exist yet, return demo data
  async getNotifications(useCache: boolean = true): Promise<ApiResponse<Notification[]>> {
    const cacheKey = CACHE_KEYS.NOTIFICATIONS('current')
    
    // Check cache first if enabled
    if (useCache && cache.has(cacheKey)) {
      const cachedData = cache.get<ApiResponse<Notification[]>>(cacheKey)
      if (cachedData) {
        // Using cached notifications
        return cachedData
      }
    }
    
    // Fetch from API
    const response = await this.request<Notification[]>('/notifications')
    
    // Cache successful responses
    if (response.success && useCache) {
      cache.set(cacheKey, response, CACHE_CONFIG.NOTIFICATIONS)
    }
    
    return response
  }

  async getUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.request<Notification[]>('/notifications/unread')
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<number>> {
    return this.request<number>('/notifications/unread/count')
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/notifications/read-all', {
      method: 'PUT'
    })
  }

  // Auto-upgrade functionality
  async checkAutoUpgrade(): Promise<ApiResponse<any>> {
    return this.request<any>('/user/check-auto-upgrade', {
      method: 'POST'
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('auth_token')
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}
