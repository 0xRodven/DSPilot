"use client";

import { useState } from "react";

import type { Id } from "@convex/_generated/dataModel";
import { Calendar, GraduationCap, MessageCircle, Package, Pencil, Phone, User, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { describeDriver } from "@/lib/utils/driver-display";
import { getDwcBadgeClass, getDwcTextClass } from "@/lib/utils/performance-color";

import { PhoneEditModal } from "./phone-edit-modal";

interface DriverHeaderProps {
  driver: DriverDetail;
  driverId: Id<"drivers">;
  onPlanCoaching?: () => void;
}

export function DriverHeader({ driver, driverId, onPlanCoaching }: DriverHeaderProps) {
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const driverDisplay = describeDriver(driver.name, driver.amazonId);

  // Format phone number for display
  const formatPhone = (phone: string): string => {
    if (!phone || phone.length < 4) return phone;
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.startsWith("+33") && cleaned.length === 12) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    return phone;
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Avatar and Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 font-bold text-2xl text-card-foreground">
                {driverDisplay.label}
                {driverDisplay.isWalker && (
                  <Badge
                    variant="outline"
                    className="border-sky-500/40 bg-sky-500/15 font-medium text-[11px] text-sky-300"
                  >
                    Walker
                  </Badge>
                )}
              </h2>
              <p className="font-mono text-muted-foreground text-sm">{driver.amazonId}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Actif depuis {driver.activeSince}
                </span>
                {/* Phone number display */}
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-0.5 transition-colors hover:bg-muted"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {driver.phoneNumber ? (
                    <>
                      <span className="font-mono text-xs">{formatPhone(driver.phoneNumber)}</span>
                      {driver.whatsappOptIn && <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />}
                      <Pencil className="h-3 w-3 opacity-50" />
                    </>
                  ) : (
                    <span className="text-xs opacity-70">Ajouter téléphone</span>
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {driver.daysActive} jours cette semaine
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {driver.deliveries} livraisons
                </span>
                {driver.streak > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Zap className="h-4 w-4" />
                    Streak: {driver.streak} semaines ≥{driver.dwcPercent >= 95 ? "95" : "90"}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Big Badge - uses DWC% gradient colors */}
          <div
            className={cn(
              "flex flex-col items-center rounded-xl border-2 px-6 py-4",
              getDwcBadgeClass(driver.dwcPercent).replace("bg-", "border-").replace("/10", "/50"),
              getDwcBadgeClass(driver.dwcPercent).split(" ")[0],
            )}
          >
            <span className={cn("font-medium text-sm tabular-nums", getDwcTextClass(driver.dwcPercent))}>DWC</span>
            <span className={cn("font-bold text-3xl tabular-nums", getDwcTextClass(driver.dwcPercent))}>
              {driver.dwcPercent}%
            </span>
            <span className="mt-1 text-muted-foreground text-sm">
              {driver.rank !== null ? `Rang #${driver.rank} / ${driver.totalDrivers}` : "Non classé"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-transparent" onClick={onPlanCoaching}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Planifier Coaching
          </Button>
        </div>
      </CardContent>

      {/* Phone Edit Modal */}
      <PhoneEditModal
        open={showPhoneModal}
        onOpenChange={setShowPhoneModal}
        driverId={driverId}
        driverName={driver.name}
        currentPhone={driver.phoneNumber}
        currentOptIn={driver.whatsappOptIn}
      />
    </Card>
  );
}
