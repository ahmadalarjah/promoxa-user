import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { apiService } from './api';

export interface ChatMessage {
  id: number;
  username: string;
  content: string;
  created_at: string;
  isAdmin: boolean;
  isPinned: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
}

class ChatService {
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    // WebSocket chat service using STOMP
  }

  private getWebSocketUrl(): string {
    // Use production API URL if available, otherwise fallback to localhost
    // SockJS requires HTTP/HTTPS URLs, not WS/WSS - it handles WebSocket upgrade internally
    if (typeof window !== 'undefined') {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.promoxa.org';
      let wsUrl = apiBase;
      
      // Remove /api suffix if present (WebSocket endpoint is at /ws, not /api/ws)
      if (wsUrl.endsWith('/api')) {
        wsUrl = wsUrl.slice(0, -4);
      }
      
      // Ensure we have http:// or https:// protocol (SockJS requires HTTP/HTTPS)
      if (!wsUrl.startsWith('http://') && !wsUrl.startsWith('https://')) {
        // If no protocol, assume https for production
        wsUrl = `https://${wsUrl}`;
      }
      
      return `${wsUrl}/ws`;
    }
    return 'http://localhost:8080/ws';
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // Always get fresh token from localStorage (same as apiService)
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  public connectToCommunity(username: string, onMessage: (message: ChatMessage) => void) {
    this.messageCallbacks.push(onMessage);
    
    if (!this.client || !this.client.connected) {
      this.connect();
    }
  }

  private connect() {
    if (this.isConnecting || (this.client && this.client.connected)) {
      return;
    }

    this.isConnecting = true;
    const token = this.getAuthToken();
    
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      this.isConnecting = false;
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    // Create SockJS connection
    const socket = new SockJS(wsUrl);
    
    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay
        
        // Subscribe to community messages
        if (this.client) {
          this.client.subscribe('/topic/community', (message: IMessage) => {
            try {
              const data = JSON.parse(message.body);
              const normalizedMessage: ChatMessage = {
                id: parseInt(data.id) || 0,
                username: data.username || 'مستخدم غير معروف',
                content: data.content || '',
                created_at: data.createdAt || data.created_at || new Date().toISOString(),
                isAdmin: data.isAdminMessage || false,
                isPinned: data.isPinned || false,
                reactions: Array.isArray(data.reactions) ? data.reactions : []
              };
              
              console.log('Received message via WebSocket:', normalizedMessage);
              this.messageCallbacks.forEach(callback => callback(normalizedMessage));
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          });
        }
        
        // Notify connection callbacks
        this.connectionCallbacks.forEach(callback => callback(true));
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.isConnecting = false;
        this.connectionCallbacks.forEach(callback => callback(false));
        this.handleReconnect();
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
        this.isConnecting = false;
        this.connectionCallbacks.forEach(callback => callback(false));
        
        if (this.shouldReconnect) {
          this.handleReconnect();
        }
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connectionCallbacks.forEach(callback => callback(false));
      }
    });

    // Activate the client
    this.client.activate();
  }

  private handleReconnect() {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached or reconnection disabled');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.shouldReconnect && (!this.client || !this.client.connected)) {
        this.connect();
      }
    }, delay);
  }

  public async sendMessage(content: string) {
    if (!this.client || !this.client.connected) {
      // Fallback to REST API if WebSocket is not connected
      console.warn('WebSocket not connected, falling back to REST API');
      return this.sendMessageViaRest(content);
    }

    try {
      this.client.publish({
        destination: '/app/community/message',
        body: JSON.stringify({ content })
      });
      console.log('Message sent via WebSocket');
    } catch (error) {
      console.error('Error sending message via WebSocket, falling back to REST:', error);
      return this.sendMessageViaRest(content);
    }
  }

  private async sendMessageViaRest(content: string): Promise<ChatMessage> {
    // Use apiService for consistency and proper authentication handling
    try {
      const response = await apiService.sendChatMessage(content);
      
      if (response.success && response.data) {
        const message = response.data;
        const normalizedMessage: ChatMessage = {
          id: parseInt(String(message.id)) || 0,
          username: message.username || 'مستخدم غير معروف',
          content: message.content || '',
          created_at: message.created_at || message.timestamp || message.createdAt || new Date().toISOString(),
          isAdmin: message.isAdmin || message.isAdminMessage || false,
          isPinned: message.isPinned || false,
          reactions: Array.isArray(message.reactions) 
            ? message.reactions.map((r: any) => ({
                emoji: r.emoji || r.type || '👍',
                count: r.count || 0,
                users: r.users || []
              }))
            : []
        };
        
        // The message will be received via WebSocket broadcast, but we can also add it locally
        // to ensure immediate UI update
        this.messageCallbacks.forEach(callback => callback(normalizedMessage));
        
        return normalizedMessage;
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message via REST:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  public disconnect() {
    this.shouldReconnect = false;
    
    if (this.client) {
      if (this.client.connected) {
        this.client.deactivate();
      }
      this.client = null;
    }
    
    this.messageCallbacks = [];
    this.connectionCallbacks = [];
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }
}

// Export singleton instance
export const chatService = new ChatService();
