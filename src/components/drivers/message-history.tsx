"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface MessageHistoryProps {
  driverId: Id<"drivers">
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "En attente",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  sent: {
    icon: Send,
    label: "Envoyé",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  delivered: {
    icon: CheckCircle2,
    label: "Délivré",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  failed: {
    icon: XCircle,
    label: "Échec",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  undelivered: {
    icon: AlertCircle,
    label: "Non délivré",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
}

export function MessageHistory({ driverId }: MessageHistoryProps) {
  const messages = useQuery(api.whatsapp.getDriverMessageHistory, {
    driverId,
    limit: 10,
  })

  if (messages === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Historique WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Historique WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Aucun message envoyé</p>
            <p className="text-xs mt-1">
              Les récapitulatifs apparaîtront ici une fois envoyés
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Historique WhatsApp
          <Badge variant="secondary" className="ml-auto">
            {messages.length} message{messages.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((message: typeof messages[number]) => {
          const status = statusConfig[message.status as keyof typeof statusConfig]
          const StatusIcon = status.icon

          return (
            <div
              key={message._id}
              className={cn(
                "rounded-lg border p-3",
                message.status === "failed" && "border-red-500/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      S{message.week} {message.year}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), "dd MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Message preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.messageContent.slice(0, 100)}
                    {message.messageContent.length > 100 && "..."}
                  </p>

                  {/* Error message if failed */}
                  {message.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">
                      {message.errorMessage}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    status.bgColor,
                    status.color
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {message.sentAt && (
                  <span>
                    Envoyé{" "}
                    {formatDistanceToNow(new Date(message.sentAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
                {message.deliveredAt && (
                  <span className="text-emerald-500">
                    Délivré{" "}
                    {formatDistanceToNow(new Date(message.deliveredAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
