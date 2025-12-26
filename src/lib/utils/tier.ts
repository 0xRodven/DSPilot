// Tier utilities for driver classification

export type Tier = "fantastic" | "great" | "fair" | "poor"

export const getTier = (dwcPercent: number): Tier => {
  if (dwcPercent >= 98.5) return "fantastic"
  if (dwcPercent >= 96) return "great"
  if (dwcPercent >= 90) return "fair"
  return "poor"
}

export const getTierColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "text-emerald-400"
    case "great":
      return "text-blue-400"
    case "fair":
      return "text-amber-400"
    case "poor":
      return "text-red-400"
  }
}

export const getTierBgColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "bg-emerald-500/20 text-emerald-400"
    case "great":
      return "bg-blue-500/20 text-blue-400"
    case "fair":
      return "bg-amber-500/20 text-amber-400"
    case "poor":
      return "bg-red-500/20 text-red-400"
  }
}

export const getTierBorderColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "border-l-emerald-500"
    case "great":
      return "border-l-blue-500"
    case "fair":
      return "border-l-amber-500"
    case "poor":
      return "border-l-red-500"
  }
}

export const tierThresholds = {
  fantastic: 98.5,
  great: 96,
  fair: 90,
  poor: 0,
} as const

export const tierLabels: Record<Tier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

export const tierDescriptions: Record<Tier, string> = {
  fantastic: "DWC ≥ 98.5% — Performance excellente",
  great: "DWC ≥ 96% — Très bonne performance",
  fair: "DWC ≥ 90% — Performance acceptable",
  poor: "DWC < 90% — Performance à améliorer",
}
