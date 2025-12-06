import apiClient from "./api-client"

export interface ChatConversation {
  id: string
  conversationId: string
  matchId: string
  userId: string
  userName: string
  userAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline?: boolean
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
  isCurrentUser: boolean
}

export interface SendMessageRequest {
  matchId: string
  text: string
}

export interface SendMessageResponse {
  id: string
  matchId: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
}

export interface InitiateConversationRequest {
  requestId: string
  otherUserId: string
}

export interface InitiateConversationResponse {
  success: boolean
  conversationId?: string
  message?: string
}

export interface ResolveConversationResponse {
  conversationId: string
}

export interface GetConversationsResponse {
  $id?: string
  $values: {
    $id?: string
    id: string
    matchId: string
    otherUserId: string
    otherUserName: string
    otherUserAvatar?: string
    lastMessage: string
    lastMessageTimestamp: string
    unreadCount: number
    isOnline?: boolean
  }[]
}

export interface GetMessagesResponse {
  $id?: string
  $values: {
    $id?: string
    id: string
    conversationId: string
    fromUserId: string
    fromUserName: string
    message: string
    messageType: string
    fileUrl?: string | null
    fileName?: string
    fileSize?: number | null
    isRead: boolean
    createdAt: string
    readAt?: string | null
    isDeleted: boolean
  }[]
}

/**
 * Initiate a new conversation
 */
export async function initiateConversation(requestId: string, otherUserId: string): Promise<boolean> {
  try {
    console.log(`🔵 [initiateConversation] Initiating conversation:`, { requestId, otherUserId })
    const response = await apiClient.post("/api/Chat/conversations/init", {
      RequestId: requestId,
      OtherUserId: otherUserId,
    })
    console.log("✅ [initiateConversation] Conversation initiated successfully:", response.data)
    return true
  } catch (error: any) {
    console.error("❌ [initiateConversation] Failed to initiate conversation:", error.response?.data || error.message)
    throw error
  }
}

/**
 * Resolve/get conversation ID for a specific request and user
 */
export async function resolveConversation(requestId: string, otherUserId: string): Promise<string | null> {
  try {
    console.log(`🔍 [resolveConversation] Resolving conversation:`, { requestId, otherUserId })
    const response = await apiClient.get<ResolveConversationResponse>(
      `/api/Chat/conversations/resolve`,
      {
        params: {
          requestId,
          otherUserId,
        },
      }
    )
    console.log("✅ [resolveConversation] Conversation resolved:", response.data)
    return response.data.conversationId
  } catch (error: any) {
    console.error("❌ [resolveConversation] Failed to resolve conversation:", error.response?.data || error.message)
    return null
  }
}

/**
 * Fetch all chat conversations for the current user
 */
export async function getConversations(): Promise<ChatConversation[]> {
  try {
    const response = await apiClient.get<GetConversationsResponse>("/api/Chat/conversations")
    
    console.log("📥 [getConversations] Raw API response:", response.data)
    
    // Handle .NET $values wrapper
    const conversations = response.data.$values || response.data
    
    if (!Array.isArray(conversations)) {
      console.warn("⚠️ [getConversations] Expected array but got:", conversations)
      return []
    }

    console.log("📋 [getConversations] Found conversations:", conversations.length)

    // Map to frontend format
    return conversations.map((conv) => {
      console.log("📬 Conversation:", {
        id: conv.id,
        lastMessage: conv.lastMessage,
        lastMessageTimestamp: conv.lastMessageTimestamp,
        otherUserName: conv.otherUserName
      })
      
      return {
        id: conv.id,
        conversationId: conv.id, // Use id as conversationId
        matchId: conv.matchId,
        userId: conv.otherUserId,
        userName: conv.otherUserName,
        userAvatar: conv.otherUserAvatar,
        lastMessage: conv.lastMessage || "",
        lastMessageTime: conv.lastMessageTimestamp ? formatMessageTime(conv.lastMessageTimestamp) : "",
        unreadCount: conv.unreadCount || 0,
        isOnline: conv.isOnline || false,
      }
    })
  } catch (error) {
    console.error("❌ [getConversations] Failed to fetch conversations:", error)
    return []
  }
}

/**
 * Fetch all messages for a specific conversation
 */
export async function getMessages(conversationId: string, page: number = 1, pageSize: number = 50): Promise<Message[]> {
  try {
    console.log(`📨 [getMessages] Fetching messages for conversation: ${conversationId}`)
    const response = await apiClient.get<GetMessagesResponse>(
      `/api/Chat/conversations/${conversationId}/messages`,
      {
        params: {
          page,
          pageSize,
        },
      }
    )
    
    console.log("📥 [getMessages] Raw API response:", response.data)
    
    // Handle .NET $values wrapper
    const messages = response.data.$values || response.data
    
    if (!Array.isArray(messages)) {
      console.warn("⚠️ [getMessages] Expected array but got:", messages)
      return []
    }

    console.log(`📋 [getMessages] Found messages:`, messages.length)

    // Get current user ID from localStorage
    let currentUserId = ""
    try {
      const authUser = localStorage.getItem("authUser")
      if (authUser) {
        const user = JSON.parse(authUser)
        currentUserId = user.id || ""
      }
    } catch (error) {
      console.error("❌ Failed to parse authUser from localStorage:", error)
    }
    
    console.log(`👤 [getMessages] Current user ID:`, currentUserId)

    // Map to frontend format
    const mappedMessages = messages.map((msg) => {
      const isCurrentUser = msg.fromUserId === currentUserId
      console.log(`📨 Message from ${msg.fromUserName} (${msg.fromUserId}):`, {
        text: msg.message,
        isCurrentUser,
        matches: msg.fromUserId === currentUserId
      })
      
      return {
        id: msg.id,
        senderId: msg.fromUserId,
        senderName: msg.fromUserName,
        text: msg.message,
        timestamp: formatMessageTime(msg.createdAt),
        isCurrentUser,
      }
    })
    
    return mappedMessages
  } catch (error: any) {
    console.error(`❌ [getMessages] Failed to fetch messages for conversation ${conversationId}:`, error.response?.data || error.message)
    return []
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, text: string): Promise<SendMessageResponse | null> {
  try {
    console.log(`📤 [sendMessage] Sending to conversation ${conversationId}:`, text)
    const response = await apiClient.post<SendMessageResponse>(`/api/Chat/conversations/${conversationId}/messages`, {
      message: text,
    })

    console.log("✅ [sendMessage] Message sent successfully:", response.data)
    return response.data
  } catch (error: any) {
    console.error("❌ [sendMessage] Failed to send message:", error.response?.data || error.message)
    return null
  }
}

/**
 * Mark all messages as read for a specific conversation
 */
export async function markMessagesAsRead(conversationId: string): Promise<boolean> {
  try {
    console.log(`📖 [markMessagesAsRead] Marking conversation ${conversationId} as read`)
    await apiClient.put(`/api/Chat/conversations/${conversationId}/mark-all-read`)
    console.log(`✅ [markMessagesAsRead] Messages marked as read for conversation ${conversationId}`)
    return true
  } catch (error: any) {
    console.error(`❌ [markMessagesAsRead] Failed to mark messages as read:`, error.response?.data || error.message)
    return false
  }
}

/**
 * Get total unread message count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await apiClient.get<{ count: number }>("/api/Chat/unread-count")
    return response.data.count || 0
  } catch (error) {
    console.error("❌ [getUnreadCount] Failed to fetch unread count:", error)
    return 0
  }
}

/**
 * Format timestamp to relative time (e.g., "2:15 PM", "Yesterday", "12/01/2025")
 */
function formatMessageTime(timestamp: string): string {
  try {
    if (!timestamp) return ""
    
    const messageDate = new Date(timestamp)
    
    // Check if date is valid
    if (isNaN(messageDate.getTime())) {
      console.warn("⚠️ Invalid timestamp:", timestamp)
      return ""
    }
    
    const now = new Date()
    const diffInMs = now.getTime() - messageDate.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24

    // Today - show time
    if (diffInDays < 1 && now.getDate() === messageDate.getDate()) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    // Yesterday
    if (diffInDays < 2 && now.getDate() - messageDate.getDate() === 1) {
      return "Yesterday"
    }

    // Within a week - show day name
    if (diffInDays < 7) {
      return messageDate.toLocaleDateString("en-US", { weekday: "long" })
    }

    // Older - show date
    return messageDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error("❌ [formatMessageTime] Error formatting timestamp:", error)
    return ""
  }
}
