"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Copy, Check, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateWhatsAppRecap } from "@/lib/coaching/recap-generator"

interface DriverComparison {
  id: string
  name: string
  current: {
    deliveries: number
    dwc: number
    iadc: number
  }
  previous: {
    deliveries: number
    dwc: number
    iadc: number
  }
  diff: {
    deliveries: number
    dwc: number
    iadc: number
  }
  status: "ok" | "watch" | "alert"
}

interface RecapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: DriverComparison | null
  week: number
}

export function RecapModal({ open, onOpenChange, driver, week }: RecapModalProps) {
  const [copied, setCopied] = useState(false)

  // Generate message only when driver is available
  const message = driver ? generateWhatsAppRecap(driver, week) : ""

  if (!driver) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    toast.success("Message copie dans le presse-papier")
    setTimeout(() => setCopied(false), 2000)
  }

  const DiffBadge = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const isPositive = value >= 0
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{value}{suffix}
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recap: {driver.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Apercu
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Colis</p>
                <p className="text-lg font-semibold text-foreground">{driver.current.deliveries}</p>
                <DiffBadge value={driver.diff.deliveries} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DWC</p>
                <p className="text-lg font-semibold text-foreground">{driver.current.dwc}%</p>
                <DiffBadge value={driver.diff.dwc} suffix="%" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IADC</p>
                <p className="text-lg font-semibold text-foreground">{driver.current.iadc}%</p>
                <DiffBadge value={driver.diff.iadc} suffix="%" />
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Message WhatsApp</h4>
            <div className="rounded-lg border border-border bg-card p-4 font-mono text-sm whitespace-pre-wrap">
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
  )
}
