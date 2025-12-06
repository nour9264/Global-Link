import * as signalR from "@microsoft/signalr"

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null
  private baseUrl: string
  private getToken: () => string | null

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl
    this.getToken = getToken
  }

  /**
   * Establish connection to SignalR hub
   * Must be called after user login (when JWT token is available)
   */
  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("✅ Already connected to SignalR")
      return // Already connected
    }

    const token = this.getToken()
    if (!token) {
      throw new Error("JWT token is required to connect to chat hub")
    }

    // Build hub URL with token
    const hubUrl = `${this.baseUrl}/chatHub`

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | 
                   signalR.HttpTransportType.ServerSentEvents |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 30s intervals
          if (retryContext.previousRetryCount === 0) return 0
          if (retryContext.previousRetryCount === 1) return 2000
          if (retryContext.previousRetryCount === 2) return 10000
          return 30000
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    // Register connection state handlers
    this.connection.onclose((error) => {
      console.warn("🔌 SignalR connection closed", error)
    })

    this.connection.onreconnecting((error) => {
      console.log("🔄 SignalR reconnecting...", error)
    })

    this.connection.onreconnected((connectionId) => {
      console.log("✅ SignalR reconnected:", connectionId)
    })

    try {
      await this.connection.start()
      console.log("✅ SignalR connected to chat hub")
    } catch (error) {
      console.error("❌ SignalR connection failed:", error)
      throw error
    }
  }

  /**
   * Disconnect from SignalR hub
   * Call this on user logout
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
      console.log("🔌 SignalR disconnected")
    }
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null
  }

  /**
   * Get the connection instance (for registering custom event handlers)
   */
  getConnection(): signalR.HubConnection | null {
    return this.connection
  }

  /**
   * Join a conversation room
   */
  async joinConversation(conversationId: string): Promise<void> {
    if (!this.connection) throw new Error("Not connected")
    await this.connection.invoke("JoinConversation", conversationId)
    console.log("✅ Joined conversation:", conversationId)
  }

  /**
   * Leave a conversation room
   */
  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection) return
    try {
      await this.connection.invoke("LeaveConversation", conversationId)
      console.log("👋 Left conversation:", conversationId)
    } catch (error) {
      console.error("Failed to leave conversation:", error)
    }
  }

  /**
   * Send a message via SignalR
   */
  async sendMessage(conversationId: string, message: string): Promise<void> {
    if (!this.connection) throw new Error("Not connected")
    await this.connection.invoke("SendMessage", conversationId, message, "text")
    console.log("📤 Message sent via SignalR")
  }

  /**
   * Send typing indicator
   */
  async setTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.connection) return
    try {
      await this.connection.invoke("Typing", conversationId, isTyping)
    } catch (error) {
      console.error("Failed to send typing indicator:", error)
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    if (!this.connection) return
    try {
      await this.connection.invoke("MarkAsRead", conversationId, messageId)
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  /**
   * Get conversation history via SignalR
   */
  async getConversationHistory(conversationId: string, page: number = 1, pageSize: number = 50): Promise<void> {
    if (!this.connection) throw new Error("Not connected")
    await this.connection.invoke("GetConversationHistory", conversationId, page, pageSize)
  }
}

// Get API URL from environment or use default
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || "https://uneriferous-eda-nonseasonally.ngrok-free.dev"
  }
  return "https://uneriferous-eda-nonseasonally.ngrok-free.dev"
}

// Get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("authToken")
  }
  return null
}

// Export singleton instance
export const chatSignalRService = new ChatSignalRService(getApiUrl(), getToken)
