/**
 * performance-color.ts
 *
 * Continuous gradient color system for DWC% metrics.
 * Replaces the categorical tier system (Fantastic/Great/Fair/Poor) with
 * smooth interpolation between color stops, giving precise visual feedback
 * at every percentage point rather than hard bucket boundaries.
 */

// ---------------------------------------------------------------------------
// Color stops
// ---------------------------------------------------------------------------

/** A single stop in the DWC gradient, pairing a percentage with a hex color. */
export interface DwcColorStop {
  pct: number;
  hex: string;
  textClass: string;
  badgeClass: string;
  borderClass: string;
}

/**
 * Canonical gradient stops ordered from worst to best.
 * Used by charts (e.g. Recharts custom color scale) and by the lerp helpers.
 */
export const DWC_GRADIENT_STOPS: DwcColorStop[] = [
  {
    pct: 80,
    hex: "#ef4444",
    textClass: "text-red-500",
    badgeClass: "bg-red-500/10 text-red-500",
    borderClass: "border-l-red-500",
  },
  {
    pct: 85,
    hex: "#f97316",
    textClass: "text-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-500",
    borderClass: "border-l-orange-500",
  },
  {
    pct: 88,
    hex: "#f59e0b",
    textClass: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-500",
    borderClass: "border-l-amber-500",
  },
  {
    pct: 90,
    hex: "#60a5fa",
    textClass: "text-blue-400",
    badgeClass: "bg-blue-400/10 text-blue-400",
    borderClass: "border-l-blue-400",
  },
  {
    pct: 92,
    hex: "#3b82f6",
    textClass: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-500",
    borderClass: "border-l-blue-500",
  },
  {
    pct: 95,
    hex: "#10b981",
    textClass: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-500",
    borderClass: "border-l-emerald-500",
  },
  {
    pct: 97,
    hex: "#059669",
    textClass: "text-emerald-600",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
    borderClass: "border-l-emerald-600",
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse a hex color string (e.g. "#ef4444") into [r, g, b] components (0-255).
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Format [r, g, b] components (0-255) back into a lowercase hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.clamp(n, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Clamp a number between min and max (inclusive). */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor in [0, 1]
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Find the two bracketing stops for a given dwcPercent and return the
 * interpolation factor t ∈ [0, 1] between them.
 * Returns { lower, upper, t } where lower === upper at the extremes.
 */
function bracketStops(dwcPercent: number): {
  lower: DwcColorStop;
  upper: DwcColorStop;
  t: number;
} {
  const stops = DWC_GRADIENT_STOPS;

  // Clamp below the first stop
  if (dwcPercent <= stops[0].pct) {
    return { lower: stops[0], upper: stops[0], t: 0 };
  }

  // Clamp above the last stop
  const last = stops[stops.length - 1];
  if (dwcPercent >= last.pct) {
    return { lower: last, upper: last, t: 0 };
  }

  // Find bracketing pair
  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (dwcPercent >= lo.pct && dwcPercent <= hi.pct) {
      const t = (dwcPercent - lo.pct) / (hi.pct - lo.pct);
      return { lower: lo, upper: hi, t };
    }
  }

  // Fallback — should never be reached
  return { lower: last, upper: last, t: 0 };
}

/**
 * Find the nearest stop (by pct distance) for a given dwcPercent.
 */
function nearestStop(dwcPercent: number): DwcColorStop {
  const stops = DWC_GRADIENT_STOPS;
  let nearest = stops[0];
  let minDist = Math.abs(dwcPercent - stops[0].pct);

  for (let i = 1; i < stops.length; i++) {
    const dist = Math.abs(dwcPercent - stops[i].pct);
    if (dist < minDist) {
      minDist = dist;
      nearest = stops[i];
    }
  }

  return nearest;
}

// Patch Math to include a clamp helper used in rgbToHex
// (avoids importing a library for a single clamp call)
declare global {
  interface Math {
    clamp(value: number, min: number, max: number): number;
  }
}
Math.clamp = clamp;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns an interpolated hex color for the given DWC percentage.
 *
 * Color stops:
 *   80% → #ef4444 (red)
 *   85% → #f97316 (orange)
 *   88% → #f59e0b (amber)
 *   90% → #60a5fa (blue-400)
 *   92% → #3b82f6 (blue-500)
 *   95% → #10b981 (emerald-500)
 *   97% → #059669 (emerald-600)
 *
 * Values below 80% are clamped to red; values above 97% are clamped to
 * emerald-600.
 *
 * @example
 *   getDwcColor(92.5) // interpolated hex between #3b82f6 and #10b981
 */
export function getDwcColor(dwcPercent: number): string {
  const { lower, upper, t } = bracketStops(dwcPercent);

  if (lower === upper) return lower.hex;

  const [r1, g1, b1] = hexToRgb(lower.hex);
  const [r2, g2, b2] = hexToRgb(upper.hex);

  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/**
 * Returns the nearest Tailwind text color class for the given DWC percentage.
 *
 * Uses nearest-stop logic rather than interpolation since Tailwind classes
 * cannot be dynamically constructed at runtime.
 *
 * @example
 *   getDwcTextClass(96) // "text-emerald-500"
 *   getDwcTextClass(83) // "text-orange-500"
 */
export function getDwcTextClass(dwcPercent: number): string {
  return nearestStop(dwcPercent).textClass;
}

/**
 * Returns a Tailwind badge class (bg + text) for the given DWC percentage.
 * Suitable for pill/badge elements.
 *
 * @example
 *   getDwcBadgeClass(95) // "bg-emerald-500/10 text-emerald-500"
 *   getDwcBadgeClass(80) // "bg-red-500/10 text-red-500"
 */
export function getDwcBadgeClass(dwcPercent: number): string {
  return nearestStop(dwcPercent).badgeClass;
}

/**
 * Returns a Tailwind border-l color class for the given DWC percentage.
 * Suitable for left-border accent on cards/rows.
 *
 * @example
 *   getDwcBorderClass(90) // "border-l-blue-400"
 */
export function getDwcBorderClass(dwcPercent: number): string {
  return nearestStop(dwcPercent).borderClass;
}

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

/**
 * Breakdown of a driver pool into five DWC performance bands.
 *
 * Ranges are inclusive on both ends; the bands are non-overlapping and
 * exhaustive:
 *   below80  : dwcPercent < 80
 *   pct80to85: 80 ≤ dwcPercent < 85
 *   pct85to90: 85 ≤ dwcPercent < 90
 *   pct90to95: 90 ≤ dwcPercent < 95
 *   above95  : dwcPercent ≥ 95
 */
export interface DwcDistribution {
  /** Drivers with DWC ≥ 95% */
  above95: number;
  /** Drivers with 90% ≤ DWC < 95% */
  pct90to95: number;
  /** Drivers with 85% ≤ DWC < 90% */
  pct85to90: number;
  /** Drivers with 80% ≤ DWC < 85% */
  pct80to85: number;
  /** Drivers with DWC < 80% */
  below80: number;
}

/**
 * Counts drivers in each DWC performance band.
 *
 * @param drivers - Array of objects containing a dwcPercent field.
 * @returns A DwcDistribution with counts per band.
 *
 * @example
 *   const dist = computeDwcDistribution(drivers)
 *   console.log(`${dist.above95} drivers at Fantastic level`)
 */
export function computeDwcDistribution(drivers: { dwcPercent: number }[]): DwcDistribution {
  const result: DwcDistribution = {
    above95: 0,
    pct90to95: 0,
    pct85to90: 0,
    pct80to85: 0,
    below80: 0,
  };

  for (const driver of drivers) {
    const pct = driver.dwcPercent;
    if (pct >= 95) {
      result.above95++;
    } else if (pct >= 90) {
      result.pct90to95++;
    } else if (pct >= 85) {
      result.pct85to90++;
    } else if (pct >= 80) {
      result.pct80to85++;
    } else {
      result.below80++;
    }
  }

  return result;
}
