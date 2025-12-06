import { useState, useEffect, useCallback, useRef } from "react"
import * as signalR from "@microsoft/signalr"
import { chatSignalRService } from "@/lib/chat-signalr-service"
import type { Message } from "@/lib/chat-service"

interface UseChatSignalROptions {
  conversationId: string | null
  currentUserId: string
  onError?: (error: string) => void
  onMessageReceived?: (message: Message) => void
}

export const useChatSignalR = ({ 
  conversationId, 
  currentUserId, 
  onError,
  onMessageReceived 
}: UseChatSignalROptions) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const hasJoinedRef = useRef(false)

  // Initialize connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        await chatSignalRService.connect()
        const connection = chatSignalRService.getConnection()
        if (!connection) return

        connectionRef.current = connection
        setIsConnected(connection.state === signalR.HubConnectionState.Connected)
        setConnectionState(connection.state)

        // Register event handlers
        registerEventHandlers(connection)

        console.log("✅ Chat SignalR initialized")
      } catch (error) {
        console.error("Failed to initialize chat connection:", error)
        onError?.("Failed to connect to chat server")
      }
    }

    initConnection()

    return () => {
      // Cleanup on unmount
      if (conversationId && hasJoinedRef.current) {
        chatSignalRService.leaveConversation(conversationId).catch(console.error)
        hasJoinedRef.current = false
      }
    }
  }, [])

  // Join/leave conversation when conversationId changes
  useEffect(() => {
    if (!conversationId || !isConnected) return

    const joinConversation = async () => {
      try {
        await chatSignalRService.joinConversation(conversationId)
        hasJoinedRef.current = true
        // Load message history
        await chatSignalRService.getConversationHistory(conversationId, 1, 50)
      } catch (error) {
        console.error("Failed to join conversation:", error)
        onError?.("Failed to join conversation")
      }
    }

    joinConversation()

    return () => {
      if (hasJoinedRef.current) {
        chatSignalRService.leaveConversation(conversationId).catch(console.error)
        hasJoinedRef.current = false
      }
    }
  }, [conversationId, isConnected, onError])

  // Register all event handlers
  const registerEventHandlers = (connection: signalR.HubConnection) => {
    // Message received
    connection.on("MessageReceived", (payload: {
      ConversationId: string
      FromUserId: string
      Message: string
      MessageType: string
      Timestamp: string
    }) => {
      console.log("📨 MessageReceived event:", payload)

      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        senderId: payload.FromUserId,
        senderName: "", // Will be updated from full message data
        text: payload.Message,
        timestamp: formatMessageTime(payload.Timestamp),
        isCurrentUser: payload.FromUserId === currentUserId
      }

      setMessages(prev => [...prev, newMessage])
      onMessageReceived?.(newMessage)
    })

    // Typing indicator
    connection.on("UserTyping", (payload: {
      UserId: string
      IsTyping: boolean
    }) => {
      console.log("⌨️ UserTyping event:", payload)
      
      if (payload.UserId === currentUserId) return // Ignore own typing

      setIsTyping(payload.IsTyping)

      // Auto-hide after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (payload.IsTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
        }, 3000)
      }
    })

    // Read receipt
    connection.on("MessageRead", (payload: {
      MessageId: string
      ReadByUserId: string
      ReadAt: string
    }) => {
      console.log("✅ MessageRead event:", payload)
      
      setMessages(prev => prev.map(msg =>
        msg.id === payload.MessageId
          ? { ...msg, isRead: true, readAt: new Date(payload.ReadAt) }
          : msg
      ))
    })

    // Conversation history
    connection.on("ConversationHistory", (messagesData: any[]) => {
      console.log("📜 ConversationHistory event:", messagesData.length, "messages")
      
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        senderId: msg.fromUserId,
        senderName: msg.fromUserName,
        text: msg.message,
        timestamp: formatMessageTime(msg.createdAt),
        isCurrentUser: msg.fromUserId === currentUserId
      }))

      setMessages(formattedMessages)
    })

    // User joined
    connection.on("UserJoined", (userId: string) => {
      console.log("👤 UserJoined event:", userId)
    })

    // User left
    connection.on("UserLeft", (userId: string) => {
      console.log("👋 UserLeft event:", userId)
    })

    // Error handler
    connection.on("Error", (errorMessage: string) => {
      console.error("❌ Chat error:", errorMessage)
      onError?.(errorMessage)
    })
  }

  // Send message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!conversationId) {
      onError?.("Not connected to conversation")
      return
    }

    if (!messageText.trim()) {
      return
    }

    try {
      await chatSignalRService.sendMessage(conversationId, messageText.trim())
      // Message will be added via "MessageReceived" event
    } catch (error) {
      console.error("Failed to send message:", error)
      onError?.("Failed to send message")
    }
  }, [conversationId, onError])

  // Typing indicator
  const setTypingIndicator = useCallback((typing: boolean) => {
    if (!conversationId) return
    chatSignalRService.setTyping(conversationId, typing).catch(console.error)
  }, [conversationId])

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!conversationId) return

    try {
      await chatSignalRService.markAsRead(conversationId, messageId)
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }, [conversationId])

  return {
    messages,
    isTyping,
    isConnected,
    connectionState,
    sendMessage,
    setTypingIndicator,
    markMessageAsRead
  }
}

// Helper function
function formatMessageTime(timestamp: string): string {
  try {
    if (!timestamp) return ""
    
    const messageDate = new Date(timestamp)
    
    if (isNaN(messageDate.getTime())) {
      return ""
    }
    
    const now = new Date()
    const diffInMs = now.getTime() - messageDate.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24

    if (diffInDays < 1 && now.getDate() === messageDate.getDate()) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    if (diffInDays < 2 && now.getDate() - messageDate.getDate() === 1) {
      return "Yesterday"
    }

    if (diffInDays < 7) {
      return messageDate.toLocaleDateString("en-US", { weekday: "long" })
    }

    return messageDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    return ""
  }
}
