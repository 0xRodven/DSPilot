"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts"
import { CoachingActionDetailModal } from "@/components/coaching/coaching-action-detail-modal"
import { subDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Id } from "@convex/_generated/dataModel"
import type { CoachingActionType, CoachingStatus } from "@/lib/utils/status"
import { MessageSquare, AlertTriangle, BookOpen, Ban } from "lucide-react"

type Period = "30d" | "60d" | "90d"

interface CoachingActionData {
  id: string
  actionType: CoachingActionType
  status: CoachingStatus
  reason: string
  dwcAtAction: number
  dwcAfterAction?: number
  followUpDate?: string
  notes?: string
  createdAt: number
}

interface DailyPerformanceChartWithCoachingProps {
  driverId: Id<"drivers">
  driverName: string
}

// Marker colors per action type
const markerColors: Record<CoachingActionType, string> = {
  discussion: "#3b82f6", // blue
  warning: "#f59e0b", // amber
  training: "#10b981", // emerald
  suspension: "#ef4444", // red
}

const actionIcons: Record<CoachingActionType, typeof MessageSquare> = {
  discussion: MessageSquare,
  warning: AlertTriangle,
  training: BookOpen,
  suspension: Ban,
}

const actionLabels: Record<CoachingActionType, string> = {
  discussion: "Discussion",
  warning: "Avertissement",
  training: "Formation",
  suspension: "Suspension",
}

// Custom dot component for coaching markers
function CoachingMarkerDot({
  cx,
  cy,
  payload,
  onClick,
}: {
  cx: number
  cy: number
  payload: { coachingAction?: CoachingActionData }
  onClick: (action: CoachingActionData) => void
}) {
  if (!payload.coachingAction || !cx || !cy) return null

  const action = payload.coachingAction
  const color = markerColors[action.actionType]

  return (
    <g
      onClick={(e) => {
        e.stopPropagation()
        onClick(action)
      }}
      className="cursor-pointer"
      style={{ cursor: "pointer" }}
    >
      {/* Background circle */}
      <circle cx={cx} cy={cy - 20} r={12} fill={color} opacity={0.9} />
      {/* Connector line */}
      <line x1={cx} y1={cy - 8} x2={cx} y2={cy} stroke={color} strokeWidth={2} />
      {/* Inner circle for visual feedback */}
      <circle cx={cx} cy={cy - 20} r={6} fill="white" opacity={0.3} />
    </g>
  )
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number | null
    color: string
    payload: {
      date: string
      dwcPercent: number | null
      iadcPercent: number | null
      deliveries: number
      errors: number
      coachingAction?: CoachingActionData
    }
  }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
      <p className="font-medium text-popover-foreground">
        {format(new Date(data.date), "EEEE d MMM", { locale: fr })}
      </p>
      <div className="mt-2 space-y-1 text-sm">
        {data.dwcPercent !== null && (
          <p className="text-emerald-400">DWC: {data.dwcPercent.toFixed(1)}%</p>
        )}
        {data.iadcPercent !== null && (
          <p className="text-purple-400">IADC: {data.iadcPercent.toFixed(1)}%</p>
        )}
        {data.deliveries > 0 && (
          <p className="text-muted-foreground">
            {data.deliveries} livraisons • {data.errors} erreurs
          </p>
        )}
        {data.coachingAction && (
          <div className="mt-2 pt-2 border-t border-border">
            <p
              className="font-medium"
              style={{ color: markerColors[data.coachingAction.actionType] }}
            >
              {actionLabels[data.coachingAction.actionType]}
            </p>
            <p className="text-muted-foreground text-xs truncate max-w-[200px]">
              {data.coachingAction.reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function DailyPerformanceChartWithCoaching({
  driverId,
  driverName,
}: DailyPerformanceChartWithCoachingProps) {
  const [period, setPeriod] = useState<Period>("30d")
  const [selectedAction, setSelectedAction] = useState<CoachingActionData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const days = period === "30d" ? 30 : period === "60d" ? 60 : 90
    return {
      endDate: format(new Date(), "yyyy-MM-dd"),
      startDate: format(subDays(new Date(), days), "yyyy-MM-dd"),
    }
  }, [period])

  // Fetch data
  const data = useQuery(api.drivers.getDriverDailyPerformanceWithCoaching, {
    driverId,
    startDate,
    endDate,
  })

  const handleMarkerClick = (action: CoachingActionData) => {
    setSelectedAction(action)
    setModalOpen(true)
  }

  // Loading state
  if (data === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Performance Journalière
          </CardTitle>
          <div className="flex gap-1">
            {(["30d", "60d", "90d"] as Period[]).map((p) => (
              <Skeleton key={p} className="h-8 w-12" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!data || data.dailyData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Performance Journalière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Aucune donnée journalière disponible
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter data to only show days with activity
  const chartData = data.dailyData
    .filter((d) => d.dwcPercent !== null)
    .map((d) => ({
      ...d,
      dateLabel: format(new Date(d.date), "d/M"),
    }))

  // Count coaching actions
  const coachingCount = data.dailyData.filter((d) => d.coachingAction).length

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-card-foreground">
            Performance Journalière
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {chartData.length} jours • {coachingCount > 0 && `${coachingCount} coaching`}
          </p>
        </div>
        <div className="flex gap-1">
          {(["30d", "60d", "90d"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "ghost"}
              onClick={() => setPeriod(p)}
              className="h-8 px-3"
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={chartData}
            margin={{ top: 30, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[60, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference lines */}
            <ReferenceLine
              y={95}
              stroke="#10b981"
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <ReferenceLine
              y={90}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <ReferenceLine
              y={88}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              opacity={0.3}
            />

            {/* DWC Line */}
            <Line
              type="monotone"
              dataKey="dwcPercent"
              stroke="#10b981"
              strokeWidth={2}
              dot={(props) => (
                <CoachingMarkerDot
                  {...props}
                  onClick={handleMarkerClick}
                />
              )}
              activeDot={{ r: 6, fill: "#10b981" }}
              connectNulls
            />

            {/* IADC Line (secondary) */}
            <Line
              type="monotone"
              dataKey="iadcPercent"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              opacity={0.6}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-muted-foreground">DWC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-purple-500 rounded opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, #8b5cf6 2px, #8b5cf6 4px)" }} />
            <span className="text-muted-foreground">IADC</span>
          </div>
          <span className="text-muted-foreground mx-2">|</span>
          {Object.entries(markerColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground capitalize">
                {actionLabels[type as CoachingActionType]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CoachingActionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        action={selectedAction}
        driverName={driverName}
      />
    </Card>
  )
}
