// Tier utilities for driver classification

export type Tier = "fantastic" | "great" | "fair" | "poor";

// DWC Tier Classification (Updated thresholds)
export const getTier = (dwcPercent: number): Tier => {
  if (dwcPercent >= 95) return "fantastic";
  if (dwcPercent >= 90) return "great";
  if (dwcPercent >= 88) return "fair";
  return "poor";
};

// IADC Tier Classification (New)
export const getIadcTier = (iadcPercent: number): Tier => {
  if (iadcPercent >= 70) return "fantastic";
  if (iadcPercent >= 60) return "great";
  if (iadcPercent >= 50) return "fair";
  return "poor";
};

export const getTierColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "text-emerald-400";
    case "great":
      return "text-blue-400";
    case "fair":
      return "text-amber-400";
    case "poor":
      return "text-red-400";
  }
};

export const getTierBgColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "bg-emerald-500/20 text-emerald-400";
    case "great":
      return "bg-blue-500/20 text-blue-400";
    case "fair":
      return "bg-amber-500/20 text-amber-400";
    case "poor":
      return "bg-red-500/20 text-red-400";
  }
};

export const getTierBorderColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic":
      return "border-l-emerald-500";
    case "great":
      return "border-l-blue-500";
    case "fair":
      return "border-l-amber-500";
    case "poor":
      return "border-l-red-500";
  }
};

// DWC Thresholds
export const tierThresholds = {
  fantastic: 95,
  great: 90,
  fair: 88,
  poor: 0,
} as const;

// IADC Thresholds
export const iadcThresholds = {
  fantastic: 70,
  great: 60,
  fair: 50,
  poor: 0,
} as const;

export const tierLabels: Record<Tier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
};

export const tierDescriptions: Record<Tier, string> = {
  fantastic: "DWC ≥ 95% — Performance excellente",
  great: "DWC ≥ 90% — Très bonne performance",
  fair: "DWC ≥ 88% — Performance acceptable",
  poor: "DWC < 88% — Performance à améliorer",
};

export const iadcTierDescriptions: Record<Tier, string> = {
  fantastic: "IADC ≥ 70% — Performance excellente",
  great: "IADC ≥ 60% — Très bonne performance",
  fair: "IADC ≥ 50% — Performance acceptable",
  poor: "IADC < 50% — Performance à améliorer",
};

// ============================================================
// MIGRATION: Re-exports from performance-color.ts
// New code should import from "@/lib/utils/performance-color"
// ============================================================
export {
  computeDwcDistribution,
  DWC_GRADIENT_STOPS,
  type DwcColorStop,
  type DwcDistribution,
  getDwcBadgeClass,
  getDwcBorderClass,
  getDwcColor,
  getDwcTextClass,
} from "./performance-color";
