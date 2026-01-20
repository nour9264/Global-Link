"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { BuyerLayout } from "@/components/buyer-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Search, MessageSquare } from "lucide-react"
import { getAvatarUrl } from "@/lib/utils"
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  type ChatConversation,
  type Message
} from "@/lib/chat-service"
import { useSignalRChat } from "@/hooks/use-signalr-chat"
import { useAuth } from "@/contexts/auth-context"

export default function BuyerChatPage() {
  // Global debug logger for all SignalR events
  useEffect(() => {
    ; (window as any).__debugSignalR = (event: any, payload: any) => {
      console.log(`[SignalR DEBUG] Event: ${event}`, payload)
    }
  }, [])
  const { user } = useAuth()
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  // Robust current user id/name extraction
  const getCurrentUserInfo = () => {
    try {
      if (typeof window === "undefined") return { id: "", name: "" }
      const raw = localStorage.getItem("authUser")
      if (!raw) return { id: "", name: "" }
      const parsed = JSON.parse(raw)
      const id = parsed?.user?.id || parsed?.id || parsed?.userId || parsed?.UserId || parsed?.user?.Id || ""
      const name = parsed?.user?.name || parsed?.user?.fullName || parsed?.name || parsed?.userName || parsed?.username || "You"
      return { id: String(id || ""), name: String(name || "You") }
    } catch (e) {
      return { id: "", name: "" }
    }
  }

  const { id: currentUserId, name: currentUserName } = useMemo(() => getCurrentUserInfo(), [])
  console.log("[DEBUG] Current user ID:", currentUserId, "name:", currentUserName)

  // Handle incoming real-time messages
  // Safe timestamp formatting
  const safeDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const handleMessageReceived = useCallback((message: any) => {
    ; (window as any).__debugSignalR?.("MessageReceived", message)
    if (selectedChat && (message.ConversationId === selectedChat.conversationId || message.conversationId === selectedChat.conversationId)) {
      // Try all possible field names
      const senderIdRaw = message.FromUserId || message.SenderId || message.UserId || message.fromUserId || message.senderId || message.userId || ""
      const senderId = String(senderIdRaw || "")
      const senderName = message.FromUserName || message.SenderName || message.UserName || message.fromUserName || message.senderName || message.userName || "Unknown"
      const tsRaw = message.Timestamp || message.CreatedAt || message.timestamp || message.createdAt || ""
      const isMine = String(senderId).trim().toLowerCase() === String(currentUserId).trim().toLowerCase()
      const ts = safeDate(tsRaw)
      if (!ts) console.warn("[DEBUG] Invalid timestamp for message:", message)
      console.log("[DEBUG] Message senderId:", senderId, "CurrentUserId:", currentUserId)
      const newMessage: Message = {
        id: message.Id || message.id || `msg-${Date.now()}`,
        senderId,
        senderName,
        text: message.Message || message.Text || message.text || message.message || "",
        timestamp: ts || "",
        isCurrentUser: isMine,
      }
      // Prevent duplicate messages by checking if message already exists
      setMessages(prev => {
        const exists = prev.some(m =>
          m.id === newMessage.id ||
          (m.text === newMessage.text && m.senderId === newMessage.senderId && Math.abs(new Date().getTime() - Date.now()) < 2000)
        )
        if (exists) {
          console.log("[DEBUG] Duplicate message detected, skipping:", newMessage.id)
          return prev
        }
        return [...prev, newMessage]
      })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [selectedChat, currentUserId])

  // Handle typing indicator
  const handleUserTyping = useCallback((data: any) => {
    if (selectedChat) {
      const isTyping = data.IsTyping ?? data.isTyping ?? false
      const userId = data.UserId || data.userId || data.fromUserId || data.senderId || ""
      const userName = data.UserName || data.userName || data.FromUserName || data.fromUserName || (userId === selectedChat.userId ? selectedChat.userName : undefined)

      if (isTyping) {
        setTypingUser(userName || userId || null)

        // Scroll to bottom immediately when typing starts
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          const el = messagesContainerRef.current
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
        }, 150)

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        // Hide typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null)
        }, 3000)
      } else {
        setTypingUser(null)
      }
    }
  }, [selectedChat])

  // Handle conversation history from SignalR
  const handleConversationHistory = useCallback((messagesData: any[]) => {
    console.log("📜 [BuyerChat] Conversation history received:", messagesData)
    if (!messagesData || messagesData.length === 0) {
      setMessages([])
      return
    }
    ; (window as any).__debugSignalR?.("ConversationHistory", messagesData)
    const parsedMessages: Message[] = messagesData.map((msg) => {
      const senderId = msg.FromUserId || msg.SenderId || msg.UserId || msg.fromUserId || msg.senderId || msg.userId || ""
      const senderName = msg.FromUserName || msg.SenderName || msg.UserName || msg.fromUserName || msg.senderName || msg.userName || "Unknown"
      const tsRaw = msg.Timestamp || msg.CreatedAt || msg.timestamp || msg.createdAt || ""
      const isMine = senderId === currentUserId
      const ts = safeDate(tsRaw)
      if (!ts) console.warn("[DEBUG] Invalid timestamp for message:", msg)
      console.log("[DEBUG] Message senderId:", senderId, "CurrentUserId:", currentUserId)
      return {
        id: msg.Id || msg.id || `msg-${Date.now()}-${Math.random()}`,
        senderId,
        senderName,
        text: msg.Message || msg.Text || msg.text || msg.message || "",
        timestamp: ts || "",
        isCurrentUser: isMine,
      }
    })
    setMessages(parsedMessages)
    setTimeout(() => {
      // existing anchor scroll
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      // also ensure container scrolled to bottom
      try {
        const el = messagesContainerRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "auto" })
      } catch (e) { }
    }, 100)
  }, [currentUserId])

  // Always scroll to bottom when messages or typing state changes
  useEffect(() => {
    try {
      const el = messagesContainerRef.current
      if (!el) return
      // small delay to allow DOM update
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      }, 100)
    } catch (e) {
      // ignore
    }
  }, [messages, typingUser])

  // Handle SignalR errors
  const handleSignalRError = useCallback((error: string) => {
    console.error("❌ [BuyerChat] SignalR error:", error)
    // You can show a toast notification here
  }, [])

  // Initialize SignalR
  // Track online/offline status using SignalR events
  const extractUserId = (payload: any) => {
    if (!payload) return ""
    if (typeof payload === "string") return payload
    const id = payload.userId || payload.UserId || payload.id || payload.Id || payload.user?.id || payload.user?.Id || ""
    return String(id || "").trim().toLowerCase()
  }

  const handleUserJoined = useCallback((payload: any) => {
    const userId = extractUserId(payload)
    const selectedId = selectedChat?.userId ? String(selectedChat.userId).trim().toLowerCase() : ""
    console.log("[DEBUG] UserJoined payload:", payload, "=> userId:", userId, "selectedId:", selectedId)
    // Update conversations list and selected chat if present
    if (userId) {
      setConversations(prev => prev.map(c => {
        const cid = String(c.userId || "").trim().toLowerCase()
        if (cid && cid === userId) return { ...c, isOnline: true }
        return c
      }))

      if (selectedChat && selectedId && userId === selectedId) {
        setOtherUserOnline(true)
      }
    }
  }, [selectedChat])

  const handleUserLeft = useCallback((payload: any) => {
    const userId = extractUserId(payload)
    const selectedId = selectedChat?.userId ? String(selectedChat.userId).trim().toLowerCase() : ""
    console.log("[DEBUG] UserLeft payload:", payload, "=> userId:", userId, "selectedId:", selectedId)
    if (userId) {
      setConversations(prev => prev.map(c => {
        const cid = String(c.userId || "").trim().toLowerCase()
        if (cid && cid === userId) return { ...c, isOnline: false }
        return c
      }))

      if (selectedChat && selectedId && userId === selectedId) {
        setOtherUserOnline(false)
      }
    }
  }, [selectedChat])

  const { sendMessage: sendSignalRMessage, markAsRead: signalRMarkAsRead, sendTypingIndicator, isConnected } = useSignalRChat({
    conversationId: selectedChat?.conversationId || null,
    onMessageReceived: handleMessageReceived,
    onUserTyping: handleUserTyping,
    onConversationHistory: handleConversationHistory,
    onError: handleSignalRError,
    enabled: true,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onUserStatusChanged: (data: any) => {
      console.log("[DEBUG] UserStatusChanged payload:", data)
      const userIdRaw = data?.userId || data?.UserId || data?.id || data?.Id || data?.user?.id || data?.user?.Id || (typeof data === 'string' ? data : "")
      const userId = String(userIdRaw || "").trim().toLowerCase()
      const isOnline = data?.isOnline ?? data?.IsOnline ?? data?.online ?? data?.is_online ?? false
      const selectedId = selectedChat?.userId ? String(selectedChat.userId).trim().toLowerCase() : ""
      if (selectedChat && userId && selectedId && userId === selectedId) {
        setOtherUserOnline(Boolean(isOnline))
      }
    },
  })

  // Fetch conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when selecting a chat
  useEffect(() => {
    if (selectedChat && selectedChat.conversationId) {
      // Messages will be loaded via SignalR's GetConversationHistory when joining
      // No need to call HTTP endpoint here
      console.log("📱 [BuyerChat] Selected conversation:", selectedChat.conversationId)
    }
  }, [selectedChat])

  const loadConversations = async () => {
    setLoading(true)
    const data = await getConversations()
    setConversations(data)
    setLoading(false)
  }

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return
    const data = await getMessages(conversationId)
    setMessages(data)
  }

  const handleSelectChat = async (conversation: ChatConversation) => {
    setSelectedChat(conversation)
    // Reset unread count locally immediately for snappy UI
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      )
    )

    // initialize other user online state from conversation metadata
    setOtherUserOnline(Boolean(conversation.isOnline))

    // Mark messages as read on the server (one-shot REST call)
    try {
      if (conversation.conversationId) {
        const ok = await markMessagesAsRead(conversation.conversationId)
        console.log(`📖 [BuyerChat] markMessagesAsRead result for ${conversation.conversationId}:`, ok)
        if (ok) {
          // refresh conversations to show authoritative server-side unread counts
          loadConversations()
        }
      }
    } catch (err) {
      console.error("❌ [BuyerChat] markMessagesAsRead failed:", err)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat && selectedChat.conversationId) {
      setSending(true)

      const messageText = messageInput
      setMessageInput("")

      // Optimistically add message to UI
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUserId || `temp-${Date.now()}`,
        senderName: currentUserName || "You",
        text: messageText,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        isCurrentUser: true,
      }

      setMessages(prev => [...prev, tempMessage])

      try {
        // Send via SignalR for real-time delivery
        await sendSignalRMessage(messageText)
        console.log("✅ [BuyerChat] Message sent via SignalR")

        // Scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      } catch (error) {
        console.error("❌ [BuyerChat] SignalR send failed, falling back to HTTP:", error)

        // Fallback to HTTP if SignalR fails
        try {
          await sendMessage(selectedChat.conversationId, messageText)
          loadMessages(selectedChat.conversationId)
        } catch (httpError) {
          // Remove temp message on failure
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
          alert("Failed to send message. Please try again.")
        }
      } finally {
        setSending(false)
      }
    }
  }

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)

    // Send typing indicator when user is typing
    if (e.target.value && selectedChat) {
      sendTypingIndicator(true)

      // Auto-stop typing indicator after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false)
      }, 3000)
    } else if (!e.target.value) {
      // Stop typing indicator when input is empty
      sendTypingIndicator(false)
    }
  }

  // Chat List View
  if (!selectedChat) {
    return (
      <BuyerLayout>
        <div className="h-full flex flex-col bg-background">
          {/* Search Bar */}
          <div className="p-4 border-b bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search or start a new chat"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No chats yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Once you start chatting with travelers about your delivery requests, your conversations will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectChat(conversation)}
                  className="flex items-center gap-3 p-4 border-b hover:bg-muted/50
                  cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getAvatarUrl(conversation.userAvatar)} alt={conversation.userName} />
                      <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {conversation.userName}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="ml-2 bg-[#0088cc] text-white rounded-full px-2 py-0.5 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </BuyerLayout>
    )
  }

  // Individual Chat View
  return (
    <BuyerLayout>
      <div className="flex flex-col bg-background relative h-full">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card sticky z-10 top-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedChat(null)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getAvatarUrl(selectedChat.userAvatar)} alt={selectedChat.userName} />
              <AvatarFallback>{selectedChat.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            {otherUserOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{selectedChat.userName}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {otherUserOnline ? "Online" : "Offline"}
              </p>
              <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-700 text-white' : 'bg-red-600 text-white'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-200'}`} />
                {isConnected ? 'Hub: Connected' : 'Hub: Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                {!message.isCurrentUser && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(selectedChat.userAvatar)} alt={message.senderName || 'User'} />
                    <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${message.isCurrentUser
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white"
                    : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2a3942]"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${message.isCurrentUser ? "text-gray-600 dark:text-white/70" : "text-gray-500 dark:text-gray-400"
                      }`}
                  >
                    {message.timestamp}
                  </p>
                </div>

                {message.isCurrentUser && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(user?.avatarUrl)} alt="You" />
                    <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )))
          }

          {/* Typing Indicator */}
          {typingUser && (
            <div className="flex gap-2 items-center">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={getAvatarUrl(selectedChat?.userAvatar)} alt={typingUser} />
                <AvatarFallback>{typingUser.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-[#202c33] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2a3942] rounded-lg px-4 py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{typingUser} is typing...</p>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-card sticky z-10 bottom-0">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              className="bg-[#0088cc] hover:bg-[#0077b3] text-white"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </BuyerLayout>
  )
}
