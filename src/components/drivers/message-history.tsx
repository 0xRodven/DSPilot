"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, MessageCircle, Send, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MessageHistoryProps {
  driverId: Id<"drivers">;
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
};

export function MessageHistory({ driverId }: MessageHistoryProps) {
  const messages = useQuery(api.whatsapp.getDriverMessageHistory, {
    driverId,
    limit: 10,
  });

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
    );
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
            <MessageCircle className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Aucun message envoyé</p>
            <p className="mt-1 text-xs">Les récapitulatifs apparaîtront ici une fois envoyés</p>
          </div>
        </CardContent>
      </Card>
    );
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
        {messages.map((message: (typeof messages)[number]) => {
          const status = statusConfig[message.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <div
              key={message._id}
              className={cn("rounded-lg border p-3", message.status === "failed" && "border-red-500/30")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      S{message.week} {message.year}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(message.createdAt), "dd MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Message preview */}
                  <p className="line-clamp-2 text-muted-foreground text-sm">
                    {message.messageContent.slice(0, 100)}
                    {message.messageContent.length > 100 && "..."}
                  </p>

                  {/* Error message if failed */}
                  {message.errorMessage && <p className="mt-1 text-red-500 text-xs">{message.errorMessage}</p>}
                </div>

                {/* Status badge */}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs",
                    status.bgColor,
                    status.color,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
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
          );
        })}
      </CardContent>
    </Card>
  );
}
