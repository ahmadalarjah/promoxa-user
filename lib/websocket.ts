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
  private pollingInterval: NodeJS.Timeout | null = null;
  private allMessages: ChatMessage[] = [];
  private isPolling = false;

  constructor() {
    // Simple chat service using REST API + polling
  }

  public connectToCommunity(username: string, onMessage: (message: ChatMessage) => void) {
    this.messageCallbacks.push(onMessage);
    this.startPolling();
  }

  private startPolling() {
    // Clear any existing polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Start polling every 1 second for faster response
    this.pollingInterval = setInterval(async () => {
      await this.pollForNewMessages();
    }, 1000);
  }

  private async pollForNewMessages() {
    if (this.isPolling) return; // Prevent overlapping requests
    this.isPolling = true;

    try {
      const response = await fetch(`https://api.promoxa.org/api/community/messages?page=0&size=100`, {


        
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const serverMessages = data.content || [];
        
        // Polling - Server messages: ${serverMessages.length}, Local messages: ${this.allMessages.length}
        
        // Convert server messages to our format
        const normalizedServerMessages: ChatMessage[] = serverMessages.map((msg: any) => ({
          id: parseInt(msg.id) || 0,
          username: msg.username || 'مستخدم غير معروف',
          content: msg.content || '',
          created_at: msg.createdAt || msg.created_at || new Date().toISOString(),
          isAdmin: msg.isAdminMessage || false,
          isPinned: msg.isPinned || false,
          reactions: Array.isArray(msg.reactions) ? msg.reactions : []
        }));
        
        // Find new messages by comparing with our local messages
        const newMessages = normalizedServerMessages.filter(serverMsg => {
          const exists = this.allMessages.some(localMsg => localMsg.id === serverMsg.id);
          if (!exists) {
            // Found new message
          }
          return !exists;
        });
        
        if (newMessages.length > 0) {
          // Found new messages via polling
          
          // Add new messages to our local array
          this.allMessages = [...this.allMessages, ...newMessages];
          
          // Send new messages to UI
          newMessages.forEach((message) => {
            // Sending new message to UI
            this.messageCallbacks.forEach(callback => callback(message));
          });
        }
      } else {
                  // Polling failed with status
      }
    } catch (error) {
              // Error polling for messages
    } finally {
      this.isPolling = false;
    }
  }

  public async sendMessage(content: string) {
    try {
      const response = await fetch('https://api.promoxa.org/api/community/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const message = await response.json();
        // Message sent successfully
        
        // Add the sent message to our local array immediately
        const normalizedMessage: ChatMessage = {
          id: parseInt(message.id) || 0,
          username: message.username || 'مستخدم غير معروف',
          content: message.content || '',
          created_at: message.createdAt || message.created_at || new Date().toISOString(),
          isAdmin: message.isAdminMessage || false,
          isPinned: message.isPinned || false,
          reactions: Array.isArray(message.reactions) ? message.reactions : []
        };
        
        this.allMessages.push(normalizedMessage);
        
        // Send to UI immediately for sender
                  // Sending message to UI immediately
        this.messageCallbacks.forEach(callback => callback(normalizedMessage));
        
        return message;
      } else {
                  // Failed to send message
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
              // Error sending message
      throw error;
    }
  }

  public disconnect() {
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.messageCallbacks = [];
    this.allMessages = [];
  }

  public isConnected(): boolean {
    return this.pollingInterval !== null;
  }
}

// Export singleton instance
export const chatService = new ChatService();
