export type Tier = "fantastic" | "great" | "fair" | "poor";

export const DWC_TIER_THRESHOLDS = {
  fantastic: 95,
  great: 90,
  fair: 88,
  poor: 0,
} as const;

export function getTier(dwcPercent: number): Tier {
  if (dwcPercent >= DWC_TIER_THRESHOLDS.fantastic) return "fantastic";
  if (dwcPercent >= DWC_TIER_THRESHOLDS.great) return "great";
  if (dwcPercent >= DWC_TIER_THRESHOLDS.fair) return "fair";
  return "poor";
}
