import { useEffect, useRef, useCallback, useState } from "react"
import { signalRService } from "@/lib/signalr-service"
import { Message } from "@/lib/chat-service"

interface UseSignalRChatProps {
  conversationId: string | null
  onMessageReceived: (message: any) => void
  onMessageRead?: (data: any) => void
  onUserTyping?: (data: { UserId: string; IsTyping: boolean }) => void
  onConversationHistory?: (messages: any[]) => void
  onError?: (error: string) => void
  onUserJoined?: (userId: string) => void
  onUserLeft?: (userId: string) => void
  onUserStatusChanged?: (data: { userId: string; isOnline: boolean }) => void
  enabled?: boolean
}

export function useSignalRChat({
  conversationId,
  onMessageReceived,
  onMessageRead,
  onUserTyping,
  onConversationHistory,
  onError,
  onUserJoined,
  onUserLeft,
  onUserStatusChanged,
  enabled = true,
}: UseSignalRChatProps) {
  const isInitialized = useRef(false)
  const currentConversationId = useRef<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize SignalR connection
  useEffect(() => {
    if (!enabled || isInitialized.current) return

    const initializeSignalR = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          console.warn("⚠️ [useSignalRChat] No auth token found")
          return
        }

        await signalRService.connect(token)
        setIsConnected(true)
        
        // Set up event listeners
        signalRService.onReceiveMessage(onMessageReceived)
        
        if (onMessageRead) {
          signalRService.onMessageRead(onMessageRead)
        }
        
        if (onUserTyping) {
          signalRService.onUserTyping(onUserTyping)
        }

        if (onConversationHistory) {
          signalRService.onConversationHistory(onConversationHistory)
        }

        if (onError) {
          signalRService.onError(onError)
        }

        // Listen for user joined/left
        if (onUserJoined) {
          signalRService.onUserJoined(onUserJoined)
        } else {
          signalRService.onUserJoined((userId) => console.log("👤 User joined:", userId))
        }

        if (onUserLeft) {
          signalRService.onUserLeft(onUserLeft)
        } else {
          signalRService.onUserLeft((userId) => console.log("👋 User left:", userId))
        }

        if (onUserStatusChanged) {
          signalRService.onUserStatusChanged(onUserStatusChanged)
        } else {
          signalRService.onUserStatusChanged((data) => console.log("👤 User status changed:", data))
        }

        isInitialized.current = true
        console.log("✅ [useSignalRChat] SignalR initialized")
      } catch (error) {
        console.error("❌ [useSignalRChat] Failed to initialize SignalR:", error)
        setIsConnected(false)
        onError?.("Failed to connect to chat server")
      }
    }

    initializeSignalR()

    // Cleanup on unmount
    return () => {
      if (currentConversationId.current) {
        signalRService.leaveConversation(currentConversationId.current)
      }
    }
  }, [enabled])

  // Re-register handlers when callbacks change (prevents stale closures)
  useEffect(() => {
    if (!enabled || !isInitialized.current) return
    try {
      signalRService.onReceiveMessage(onMessageReceived)
    } catch (e) {
      console.warn("[useSignalRChat] Failed to re-register onReceiveMessage", e)
    }
  }, [onMessageReceived, enabled])

  useEffect(() => {
    if (!enabled || !isInitialized.current || !onConversationHistory) return
    try {
      signalRService.onConversationHistory(onConversationHistory)
    } catch (e) {
      console.warn("[useSignalRChat] Failed to re-register onConversationHistory", e)
    }
  }, [onConversationHistory, enabled])

  useEffect(() => {
    if (!enabled || !isInitialized.current || !onUserTyping) return
    try {
      signalRService.onUserTyping(onUserTyping)
    } catch (e) {
      console.warn("[useSignalRChat] Failed to re-register onUserTyping", e)
    }
  }, [onUserTyping, enabled])

  useEffect(() => {
    if (!enabled || !isInitialized.current) return
    try {
      if (onUserJoined) signalRService.onUserJoined(onUserJoined)
      if (onUserLeft) signalRService.onUserLeft(onUserLeft)
      if (onUserStatusChanged) signalRService.onUserStatusChanged(onUserStatusChanged)
    } catch (e) {
      console.warn("[useSignalRChat] Failed to re-register presence handlers", e)
    }
  }, [onUserJoined, onUserLeft, onUserStatusChanged, enabled])

  useEffect(() => {
    if (!enabled || !isInitialized.current) return
    try {
      if (onMessageRead) signalRService.onMessageRead(onMessageRead)
      if (onError) signalRService.onError(onError)
    } catch (e) {
      console.warn("[useSignalRChat] Failed to re-register misc handlers", e)
    }
  }, [onMessageRead, onError, enabled])

  // Join/leave conversation when conversationId changes
  useEffect(() => {
    if (!enabled || !conversationId) return

    let unsubOnConnected: (() => void) | null = null

    const joinConversation = async () => {
      try {
        // Leave previous conversation
        if (currentConversationId.current && currentConversationId.current !== conversationId) {
          await signalRService.leaveConversation(currentConversationId.current)
        }

        // Join new conversation
        await signalRService.joinConversation(conversationId)
        currentConversationId.current = conversationId

        // Load conversation history
        await signalRService.getConversationHistory(conversationId, 1, 50)
        // Request authoritative presence for the conversation (server should implement this)
        if (onUserStatusChanged) {
          try {
            const presence = await signalRService.getConversationPresence(conversationId)
            if (Array.isArray(presence)) {
              presence.forEach((p: any) => {
                const userId = p?.userId || p?.UserId || p?.id || p?.Id || p?.user?.id || ""
                const isOnline = p?.isOnline ?? p?.IsOnline ?? p?.online ?? false
                try { onUserStatusChanged({ userId: String(userId || ""), isOnline: Boolean(isOnline) }) } catch (e) { console.warn("[useSignalRChat] onUserStatusChanged handler failed", e) }
              })
            }
          } catch (e) {
            console.warn("[useSignalRChat] Failed to fetch conversation presence:", e)
          }
        }
      } catch (error) {
        console.error("❌ [useSignalRChat] Failed to join conversation:", error)
        onError?.("Failed to join conversation")
      }
    }

    // If already connected, join immediately. Otherwise wait for connection and join when ready.
    if (signalRService.isConnected()) {
      joinConversation()
    } else {
      // subscribe to connected event and attempt join once connected
      unsubOnConnected = signalRService.onConnected(() => {
        // double-check conversationId and enabled
        if (!enabled || !conversationId) return
        joinConversation()
      })
    }

    return () => {
      // cleanup join listener
      if (unsubOnConnected) {
        unsubOnConnected()
        unsubOnConnected = null
      }
      if (conversationId) {
        signalRService.leaveConversation(conversationId)
        currentConversationId.current = null
      }
    }
  }, [conversationId, enabled])

  // Send message via SignalR
  const sendMessage = useCallback(async (message: string) => {
    if (!conversationId) {
      throw new Error("No conversation selected")
    }

    try {
      await signalRService.sendMessage(conversationId, message, "text")
    } catch (error) {
      console.error("❌ [useSignalRChat] Failed to send message:", error)
      throw error
    }
  }, [conversationId])

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!conversationId) return

    try {
      await signalRService.markAsRead(conversationId, messageId)
    } catch (error) {
      console.error("❌ [useSignalRChat] Failed to mark as read:", error)
    }
  }, [conversationId])

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean = true) => {
    if (!conversationId) return

    try {
      await signalRService.sendTypingIndicator(conversationId, isTyping)
    } catch (error) {
      console.error("❌ [useSignalRChat] Failed to send typing indicator:", error)
    }
  }, [conversationId])

  return {
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    isConnected,
  }
}
