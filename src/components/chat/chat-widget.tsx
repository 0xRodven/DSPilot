"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAction } from "convex/react";
import { Bot, Loader2, MessageSquare, RefreshCw, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface Message {
  key: string;
  role: "user" | "assistant";
  text: string;
  status?: "pending" | "streaming" | "complete" | "failed";
  toolCalls?: Array<{
    name: string;
    status: "pending" | "running" | "complete" | "error";
  }>;
}

export function ChatWidget() {
  const { selectedStation } = useDashboardStore();
  const filters = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createThread = useAction(api.chat.createThread);
  const sendMessage = useAction(api.chat.sendMessage);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Create thread on first open
  const initializeThread = useCallback(async () => {
    if (!selectedStation.id || threadId || isCreatingThread) return;

    setIsCreatingThread(true);
    try {
      const { threadId: newThreadId } = await createThread({
        stationId: selectedStation.id as Id<"stations">,
      });
      setThreadId(newThreadId);
    } catch (error) {
      console.error("Failed to create thread:", error);
      toast.error("Erreur lors de l'initialisation du chat");
    } finally {
      setIsCreatingThread(false);
    }
  }, [selectedStation.id, threadId, isCreatingThread, createThread]);

  useEffect(() => {
    if (isOpen && !threadId) {
      initializeThread();
    }
  }, [isOpen, threadId, initializeThread]);

  // Reset thread when station changes
  useEffect(() => {
    setThreadId(null);
    setMessages([]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !threadId || !selectedStation.id || isLoading) return;

    const userMessage: Message = {
      key: `user-${Date.now()}`,
      role: "user",
      text: input.trim(),
      status: "complete",
    };

    const assistantMessage: Message = {
      key: `assistant-${Date.now()}`,
      role: "assistant",
      text: "",
      status: "pending",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    // Extract year and week from URL filters (always up-to-date)
    const selectedYear = filters.year;
    const selectedWeek = filters.weekNum;

    try {
      const result = await sendMessage({
        threadId,
        stationId: selectedStation.id as Id<"stations">,
        prompt: userMessage.text,
        selectedYear,
        selectedWeek,
      });

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
            : msg,
        ),
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Update message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.key === assistantMessage.key
            ? {
                ...msg,
                text: "Desolee, une erreur s'est produite. Veuillez reessayer.",
                status: "failed",
              }
            : msg,
        ),
      );
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setThreadId(null);
    setMessages([]);
    initializeThread();
  };

  // Don't render if no station selected
  if (!selectedStation.id) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary transition-all hover:bg-primary/90",
          "hover:scale-105 active:scale-95",
          isOpen && "hidden",
        )}
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:w-[440px]">
          {/* Header */}
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">DSPilot Assistant</SheetTitle>
                <p className="text-muted-foreground text-xs">{selectedStation.name || selectedStation.code}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNewChat} title="Nouvelle conversation">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Messages area */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {/* Welcome message */}
                {messages.length === 0 && !isCreatingThread && (
                  <div className="py-8 text-center">
                    <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 font-medium">Bonjour ! Je suis votre assistant DSPilot.</h3>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Posez-moi des questions sur vos livreurs, performances ou coaching.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
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
                            setInput(suggestion);
                            inputRef.current?.focus();
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
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
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
          <div className="border-t bg-background p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
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
              <Button type="submit" size="icon" disabled={!input.trim() || !threadId || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Semaine {filters.weekNum}/{filters.year} - {selectedStation.code}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Individual message component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted",
        )}
      >
        {isUser ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2",
          isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
        )}
      >
        {/* Message text or loading */}
        {message.status === "pending" ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm">Reflexion en cours...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert prose-headings:my-1 prose-li:my-0.5 prose-p:my-1 prose-ul:my-1 max-w-none text-sm">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 border-border/50 border-t pt-2">
            {message.toolCalls.map((tool, i) => (
              <ToolCallBadge key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Failed indicator */}
        {message.status === "failed" && (
          <div className="mt-1 text-destructive text-xs">Erreur - cliquez pour reessayer</div>
        )}
      </div>
    </div>
  );
}

// Tool call badge
function ToolCallBadge({ tool }: { tool: { name: string; status: string } }) {
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
  };

  const label = toolLabels[tool.name] || tool.name;

  return (
    <div className="mr-1 mb-1 inline-flex items-center gap-1 rounded bg-background/50 px-2 py-0.5 text-[10px]">
      {tool.status === "running" ? (
        <Loader2 className="h-2 w-2 animate-spin" />
      ) : (
        <span className="text-green-500">✓</span>
      )}
      <span>{label}</span>
    </div>
  );
}
