"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, AlertTriangle, ArrowDown, Bell, Check, Clock, TrendingDown, UserPlus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type AlertType = "dwc_drop" | "dwc_critical" | "coaching_pending" | "new_driver" | "tier_downgrade";

const alertIcons: Record<AlertType, typeof AlertTriangle> = {
  dwc_drop: TrendingDown,
  dwc_critical: AlertCircle,
  coaching_pending: Clock,
  new_driver: UserPlus,
  tier_downgrade: ArrowDown,
};

const alertColors: Record<AlertType, string> = {
  dwc_drop: "text-orange-500",
  dwc_critical: "text-red-500",
  coaching_pending: "text-amber-500",
  new_driver: "text-blue-500",
  tier_downgrade: "text-purple-500",
};

export function AlertsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedStation } = useDashboardStore();

  // Get station from store
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  const alerts = useQuery(api.alerts.getUnreadAlerts, station ? { stationId: station._id } : "skip");

  const alertCount = useQuery(api.alerts.getAlertCount, station ? { stationId: station._id } : "skip");

  const markAsRead = useMutation(api.alerts.markAsRead);
  const markAllAsRead = useMutation(api.alerts.markAllAsRead);
  const dismissAlert = useMutation(api.alerts.dismissAlert);

  const handleMarkAllRead = async () => {
    if (station) {
      await markAllAsRead({ stationId: station._id });
    }
  };

  const handleDismiss = async (alertId: Id<"alerts">) => {
    await dismissAlert({ alertId });
  };

  const handleMarkRead = async (alertId: Id<"alerts">) => {
    await markAsRead({ alertId });
  };

  const count = alertCount ?? 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="-right-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Alertes</h4>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground text-xs hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        {!alerts || alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Aucune alerte</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {alerts.map((alert) => {
                const Icon = alertIcons[alert.type as AlertType] || AlertTriangle;
                const colorClass = alertColors[alert.type as AlertType] || "text-muted-foreground";

                return (
                  <div
                    key={alert._id}
                    className={cn("flex gap-3 p-4 transition-colors hover:bg-muted/50", !alert.isRead && "bg-muted/30")}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        alert.severity === "critical" ? "bg-red-500/10" : "bg-amber-500/10",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", alert.severity === "critical" ? "text-red-500" : colorClass)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">{alert.title}</p>
                        <div className="flex items-center gap-1">
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMarkRead(alert._id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDismiss(alert._id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">{alert.message}</p>
                      <p className="text-muted-foreground/70 text-xs">
                        {formatDistanceToNow(alert.createdAt, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
