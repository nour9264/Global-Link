import * as signalR from "@microsoft/signalr"
import { API_BASE_URL } from "./config"

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnecting: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private _connectedCallbacks: Array<() => void> = []

  /**
   * Initialize SignalR connection
   */
  async connect(token: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("✅ [SignalR] Already connected")
      return
    }

    if (this.isConnecting) {
      console.log("⏳ [SignalR] Connection already in progress")
      return
    }

    try {
      this.isConnecting = true
      
      const hubUrl = `${API_BASE_URL}/chatHub`

      console.log("🔌 [SignalR] Connecting to:", hubUrl)

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          skipNegotiation: true,  // Skip negotiation and use WebSockets directly
          transport: signalR.HttpTransportType.WebSockets,
          headers: {
            "ngrok-skip-browser-warning": "true"
          },
          withCredentials: false  // Don't send credentials to avoid CORS preflight issues
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              console.error("❌ [SignalR] Max reconnection attempts reached")
              return null
            }
            const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
            console.log(`🔄 [SignalR] Reconnecting in ${delay}ms...`)
            return delay
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build()

      // Connection event handlers
      this.connection.onreconnecting((error) => {
        console.warn("⚠️ [SignalR] Reconnecting...", error)
        this.reconnectAttempts++
      })

      this.connection.onreconnected((connectionId) => {
        console.log("✅ [SignalR] Reconnected successfully:", connectionId)
        this.reconnectAttempts = 0
        // Notify subscribers on reconnected as well
        try {
          this._connectedCallbacks.forEach(cb => {
            try { cb() } catch (e) { console.warn("[SignalR] connected callback error", e) }
          })
        } catch {}
      })

      this.connection.onclose((error) => {
        console.error("❌ [SignalR] Connection closed:", error)
        this.isConnecting = false
      })

      await this.connection.start()
      console.log("✅ [SignalR] Connected successfully, ConnectionId:", this.connection.connectionId)
      this.reconnectAttempts = 0
      // Notify any subscribers waiting for a connection
      try {
        this._connectedCallbacks.forEach(cb => {
          try { cb() } catch (e) { console.warn("[SignalR] connected callback error", e) }
        })
      } catch {}
    } catch (error) {
      console.error("❌ [SignalR] Connection failed:", error)
      this.connection = null
      throw error
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Register a callback that will be invoked when the hub becomes connected (initial connect or reconnected).
   * Returns an unsubscribe function.
   */
  onConnected(callback: () => void): () => void {
    this._connectedCallbacks.push(callback)
    return () => {
      this._connectedCallbacks = this._connectedCallbacks.filter(cb => cb !== callback)
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop()
        console.log("🔌 [SignalR] Disconnected")
        this.connection = null
      } catch (error) {
        console.error("❌ [SignalR] Error disconnecting:", error)
      }
    }
  }

  /**
   * Join a conversation room
   */
  async joinConversation(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR connection is not established")
    }

    try {
      await this.connection.invoke("JoinConversation", conversationId)
      console.log(`✅ [SignalR] Joined conversation: ${conversationId}`)
    } catch (error) {
      console.error("❌ [SignalR] Failed to join conversation:", error)
      throw error
    }
  }

  /**
   * Leave a conversation room
   */
  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke("LeaveConversation", conversationId)
      console.log(`🚪 [SignalR] Left conversation: ${conversationId}`)
    } catch (error) {
      console.error("❌ [SignalR] Failed to leave conversation:", error)
    }
  }

  /**
   * Send a message through SignalR
   */
  async sendMessage(conversationId: string, message: string, messageType: string = "text"): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR connection is not established")
    }

    try {
      await this.connection.invoke("SendMessage", conversationId, message, messageType)
      console.log(`📤 [SignalR] Message sent to conversation: ${conversationId}`)
    } catch (error) {
      console.error("❌ [SignalR] Failed to send message:", error)
      throw error
    }
  }

  /**
   * Mark a specific message as read
   */
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke("MarkAsRead", conversationId, messageId)
      console.log(`✅ [SignalR] Message marked as read: ${messageId}`)
    } catch (error) {
      console.error("❌ [SignalR] Failed to mark message as read:", error)
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, isTyping: boolean = true): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke("Typing", conversationId, isTyping)
    } catch (error) {
      console.error("❌ [SignalR] Failed to send typing indicator:", error)
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string, page: number = 1, pageSize: number = 50): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR connection is not established")
    }

    try {
      await this.connection.invoke("GetConversationHistory", conversationId, page, pageSize)
      console.log(`📜 [SignalR] Requested conversation history: ${conversationId}`)
    } catch (error) {
      console.error("❌ [SignalR] Failed to get conversation history:", error)
      throw error
    }
  }

  /**
   * Request authoritative presence for a conversation from the server.
   * Server should implement a hub method named "GetConversationPresence" that returns
   * an array of objects like { userId: string, isOnline: boolean }.
   */
  async getConversationPresence(conversationId: string): Promise<any[]> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR connection is not established")
    }

    try {
      const response = await this.connection.invoke("GetConversationPresence", conversationId)
      console.log(`📡 [SignalR] Conversation presence for ${conversationId}:`, response)
      return response || []
    } catch (error) {
      console.warn("⚠️ [SignalR] Failed to request conversation presence:", error)
      return []
    }
  }

  /**
   * Listen for incoming messages
   */
  onReceiveMessage(callback: (message: any) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }

    const eventNames = [
      "MessageReceived",
      "ReceiveMessage",
      "NewMessage",
      "BroadcastMessage",
      "OnMessageReceived",
    ]

    // Remove any previous handlers for these event names to avoid duplicates
    eventNames.forEach(evt => {
      try {
        this.connection!.off(evt)
      } catch (e) {
        // ignore
      }
    })

    eventNames.forEach((evt) => {
      try {
        this.connection!.on(evt, (message: any) => {
          console.log(`📨 [SignalR:${evt}] Message received:`, message)
          try { callback(message) } catch (e) { console.warn("[SignalR] onReceiveMessage callback error", e) }
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Listen for conversation history
   */
  onConversationHistory(callback: (messages: any[]) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }
    const evtNames = ["ConversationHistory", "GetConversationHistoryResponse", "ConversationLoaded"]

    // Remove previous handlers
    evtNames.forEach(evt => {
      try { this.connection!.off(evt) } catch (e) {}
    })

    evtNames.forEach(evt => {
      try {
        this.connection!.on(evt, (messages: any[]) => {
          console.log(`📜 [SignalR:${evt}] Conversation history received:`, messages?.length || 0)
          try { callback(messages) } catch (e) { console.warn("[SignalR] onConversationHistory callback error", e) }
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Listen for errors
   */
  onError(callback: (error: string) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }

    this.connection.on("Error", (errorMessage) => {
      console.error("❌ [SignalR] Error:", errorMessage)
      callback(errorMessage)
    })
  }

  /**
   * Listen for message read status updates
   */
  onMessageRead(callback: (data: any) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }

    this.connection.on("MessageRead", (data) => {
      console.log("✅ [SignalR] Messages marked as read:", data)
      callback(data)
    })
  }

  /**
   * Listen for typing indicators
   */
  onUserTyping(callback: (data: { UserId: string; IsTyping: boolean }) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }

    const evtNames = ["UserTyping", "Typing", "OnUserTyping"]

    // Remove previous handlers
    evtNames.forEach(evt => {
      try { this.connection!.off(evt) } catch (e) {}
    })

    evtNames.forEach(evt => {
      try {
        this.connection!.on(evt, (data: any) => {
          console.log(`⌨️ [SignalR:${evt}] User typing:`, data)
          try { callback(data) } catch (e) { console.warn("[SignalR] onUserTyping callback error", e) }
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Listen for user joined event
   */
  onUserJoined(callback: (userId: string) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }
    const evtNames = ["UserJoined", "UserConnected", "UserOnline", "OnUserJoined", "UserAppeared"]
    // remove previous handlers
    evtNames.forEach(evt => { try { this.connection!.off(evt) } catch (e) {} })
    evtNames.forEach(evt => {
      try {
        this.connection!.on(evt, (payload: any) => {
          console.log(`👤 [SignalR:${evt}] User joined:`, payload)
          const id = typeof payload === 'string' ? payload : (payload?.userId || payload?.UserId || payload?.id || payload?.Id || payload?.user?.id)
          callback(String(id || ""))
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Listen for user left event
   */
  onUserLeft(callback: (userId: string) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }
    const evtNames = ["UserLeft", "UserDisconnected", "UserOffline", "OnUserLeft"]
    evtNames.forEach(evt => { try { this.connection!.off(evt) } catch (e) {} })
    evtNames.forEach(evt => {
      try {
        this.connection!.on(evt, (payload: any) => {
          console.log(`👋 [SignalR:${evt}] User left:`, payload)
          const id = typeof payload === 'string' ? payload : (payload?.userId || payload?.UserId || payload?.id || payload?.Id || payload?.user?.id)
          callback(String(id || ""))
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Listen for user online/offline status
   */
  onUserStatusChanged(callback: (data: { userId: string; isOnline: boolean }) => void): void {
    if (!this.connection) {
      console.warn("⚠️ [SignalR] Connection not initialized")
      return
    }
    const evtNames = ["UserStatusChanged", "UserOnlineStatus", "UserPresenceChanged", "UserStatus", "PresenceChanged"]
    evtNames.forEach(evt => { try { this.connection!.off(evt) } catch (e) {} })
    evtNames.forEach(evt => {
      try {
        this.connection!.on(evt, (payload: any) => {
          console.log(`👤 [SignalR:${evt}] User status changed:`, payload)
          const userId = payload?.userId || payload?.UserId || payload?.id || payload?.Id || payload?.user?.id || (typeof payload === 'string' ? payload : undefined)
          const isOnline = payload?.isOnline ?? payload?.IsOnline ?? payload?.online ?? payload?.is_online ?? false
          callback({ userId: String(userId || ""), isOnline: Boolean(isOnline) })
        })
      } catch (e) {
        console.warn(`[SignalR] Failed to register handler for ${evt}:`, e)
      }
    })
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

// Export singleton instance
export const signalRService = new SignalRService()
