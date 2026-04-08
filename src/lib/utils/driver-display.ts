/**
 * Driver display helpers — handles walker detection and "Unknown" fallback.
 *
 * Walker detection: Amazon transporter IDs starting with "OHF1" are
 * walker drivers (no vehicle, on-foot delivery). They typically have
 * no name in the roster, so we display the ID + a "Walker" badge.
 */

const UNKNOWN_NAME_PATTERNS = /^(unknown|inconnu|n\/a|null|undefined|—|-)$/i;

/**
 * Returns true when the transporter ID corresponds to a walker driver
 * (Amazon OHF1 prefix = on-foot / Helper).
 */
export function isWalkerTransporterId(transporterId: string | null | undefined): boolean {
  if (!transporterId) return false;
  return transporterId.toUpperCase().startsWith("OHF1");
}

/**
 * Returns a display-ready label for a driver, robust to missing names.
 *
 * Rules:
 *  - If the name looks valid (not empty, not "Unknown"), return it.
 *  - If the name is missing or "Unknown" but the transporter ID is a
 *    walker prefix, return the ID itself (walker label is rendered
 *    separately as a badge).
 *  - If both name and ID are missing, return null so the caller can
 *    decide what to show (we never display "Unknown").
 */
export function resolveDriverDisplayName(
  name: string | null | undefined,
  transporterId?: string | null,
): string | null {
  const trimmed = (name ?? "").trim();
  if (trimmed && !UNKNOWN_NAME_PATTERNS.test(trimmed)) {
    return trimmed;
  }
  const tid = (transporterId ?? "").trim();
  if (tid) return tid;
  return null;
}

/**
 * Convenience: returns { label, isWalker } for a driver row.
 * Use this in tables/cards that need both the display name and the
 * walker indicator.
 */
export function describeDriver(name: string | null | undefined, transporterId?: string | null) {
  const label = resolveDriverDisplayName(name, transporterId);
  return {
    label: label ?? "—",
    isWalker: isWalkerTransporterId(transporterId),
  };
}
