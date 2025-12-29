"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Message {
  key: string
  role: "user" | "assistant"
  text: string
  status?: "pending" | "streaming" | "complete" | "failed"
  toolCalls?: Array<{
    name: string
    status: "pending" | "running" | "complete" | "error"
  }>
}

export function ChatWidget() {
  const { selectedStation } = useDashboardStore()
  const filters = useFilters()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const createThread = useAction(api.chat.createThread)
  const sendMessage = useAction(api.chat.sendMessage)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Create thread on first open
  const initializeThread = useCallback(async () => {
    if (!selectedStation.id || threadId || isCreatingThread) return

    setIsCreatingThread(true)
    try {
      const { threadId: newThreadId } = await createThread({
        stationId: selectedStation.id as Id<"stations">,
      })
      setThreadId(newThreadId)
    } catch (error) {
      console.error("Failed to create thread:", error)
      toast.error("Erreur lors de l'initialisation du chat")
    } finally {
      setIsCreatingThread(false)
    }
  }, [selectedStation.id, threadId, isCreatingThread, createThread])

  useEffect(() => {
    if (isOpen && !threadId) {
      initializeThread()
    }
  }, [isOpen, threadId, initializeThread])

  // Reset thread when station changes
  useEffect(() => {
    setThreadId(null)
    setMessages([])
  }, [selectedStation.id])

  const handleSend = async () => {
    if (!input.trim() || !threadId || !selectedStation.id || isLoading) return

    const userMessage: Message = {
      key: `user-${Date.now()}`,
      role: "user",
      text: input.trim(),
      status: "complete",
    }

    const assistantMessage: Message = {
      key: `assistant-${Date.now()}`,
      role: "assistant",
      text: "",
      status: "pending",
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)

    // Extract year and week from URL filters (always up-to-date)
    const selectedYear = filters.year
    const selectedWeek = filters.weekNum

    try {
      const result = await sendMessage({
        threadId,
        stationId: selectedStation.id as Id<"stations">,
        prompt: userMessage.text,
        selectedYear,
        selectedWeek,
      })

      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.key === assistantMessage.key
            ? {
                ...msg,
                text: result.text,
                status: "complete",
                toolCalls: result.toolCalls?.map((tc: { toolName: string }) => ({
                  name: tc.toolName,
                  status: "complete" as const,
                })),
              }
            : msg
        )
      )
    } catch (error) {
      console.error("Failed to send message:", error)
      // Update message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.key === assistantMessage.key
            ? {
                ...msg,
                text: "Desolee, une erreur s'est produite. Veuillez reessayer.",
                status: "failed",
              }
            : msg
        )
      )
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    setThreadId(null)
    setMessages([])
    initializeThread()
  }

  // Don't render if no station selected
  if (!selectedStation.id) {
    return null
  }

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 transition-all",
          "hover:scale-105 active:scale-95",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[440px] flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <SheetHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">DSPilot Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedStation.name || selectedStation.code}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              title="Nouvelle conversation"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Messages area */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
              {/* Welcome message */}
              {messages.length === 0 && !isCreatingThread && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">
                    Bonjour ! Je suis votre assistant DSPilot.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Posez-moi des questions sur vos livreurs, performances ou
                    coaching.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Quels sont mes KPIs cette semaine ?",
                      "Livreurs sous-performants ?",
                      "Suggere une action de coaching",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(suggestion)
                          inputRef.current?.focus()
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Creating thread loading */}
              {isCreatingThread && (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Initialisation...</span>
                </div>
              )}

              {/* Message list */}
              {messages.map((message) => (
                <ChatMessage key={message.key} message={message} />
              ))}

              <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input area */}
          <div className="p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez une question..."
                className="flex-1"
                disabled={!threadId || isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !threadId || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Semaine {filters.weekNum}/{filters.year} - {selectedStation.code}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Individual message component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "rounded-2xl px-4 py-2 max-w-[85%]",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {/* Message text or loading */}
        {message.status === "pending" ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm">Reflexion en cours...</span>
          </div>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            {message.toolCalls.map((tool, i) => (
              <ToolCallBadge key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Failed indicator */}
        {message.status === "failed" && (
          <div className="mt-1 text-xs text-destructive">
            Erreur - cliquez pour reessayer
          </div>
        )}
      </div>
    </div>
  )
}

// Tool call badge
function ToolCallBadge({
  tool,
}: {
  tool: { name: string; status: string }
}) {
  const toolLabels: Record<string, string> = {
    // Phase 1 - Super Agent tools
    getCurrentDate: "Date",
    getStationKPIs: "KPIs",
    getDriverPerformance: "Livreur",
    listDrivers: "Liste livreurs",
    compareWeeks: "Comparaison",
    getErrorBreakdown: "Erreurs",
    getTopDriversWithErrors: "Top erreurs",
    // Phase 2 - Advanced tools
    getTrend: "Tendance",
    getRegression: "Régression",
    suggestCoaching: "Coaching",
    generateMessage: "WhatsApp",
    // Legacy tools (for compatibility)
    searchKnowledgeBase: "Recherche",
    getStationMetrics: "KPIs",
    getDriverDetails: "Detail livreur",
    listUnderperformingDrivers: "Sous-performants",
    createCoachingAction: "Coaching",
    generateWhatsAppMessage: "WhatsApp",
  }

  const label = toolLabels[tool.name] || tool.name

  return (
    <div className="inline-flex items-center gap-1 text-[10px] bg-background/50 rounded px-2 py-0.5 mr-1 mb-1">
      {tool.status === "running" ? (
        <Loader2 className="h-2 w-2 animate-spin" />
      ) : (
        <span className="text-green-500">✓</span>
      )}
      <span>{label}</span>
    </div>
  )
}
