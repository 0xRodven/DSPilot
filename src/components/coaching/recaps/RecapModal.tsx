"use client";

import { useState } from "react";

import { Check, Copy, Package, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateWhatsAppRecap } from "@/lib/coaching/recap-generator";
import { cn } from "@/lib/utils";

interface DriverComparison {
  id: string;
  name: string;
  current: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  previous: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  diff: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  status: "ok" | "watch" | "alert";
}

interface RecapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverComparison | null;
  week: number;
}

export function RecapModal({ open, onOpenChange, driver, week }: RecapModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate message only when driver is available
  const message = driver ? generateWhatsAppRecap(driver, week) : "";

  if (!driver) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Message copie dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const DiffBadge = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const isPositive = value >= 0;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium text-xs",
          isPositive ? "text-emerald-500" : "text-red-500",
        )}
      >
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}
        {value}
        {suffix}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recap: {driver.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
              <Package className="h-4 w-4" />
              Apercu
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Colis</p>
                <p className="font-semibold text-foreground text-lg">{driver.current.deliveries}</p>
                <DiffBadge value={driver.diff.deliveries} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">DWC</p>
                <p className="font-semibold text-foreground text-lg">{driver.current.dwc}%</p>
                <DiffBadge value={driver.diff.dwc} suffix="%" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">IADC</p>
                <p className="font-semibold text-foreground text-lg">{driver.current.iadc}%</p>
                <DiffBadge value={driver.diff.iadc} suffix="%" />
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground text-sm">Message WhatsApp</h4>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-sm">
              {message}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copie !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
