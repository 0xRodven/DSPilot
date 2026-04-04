#!/usr/bin/env npx tsx

/**
 * cleanup-fake-dnr.ts — Delete fake test DNR data (S7-S12) from Convex.
 *
 * Usage:
 *   npx tsx scripts/cleanup-fake-dnr.ts
 *
 * Env vars:
 *   CONVEX_URL / NEXT_PUBLIC_CONVEX_URL
 *   CONVEX_DEPLOY_KEY
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const STATION_ID = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

async function main() {
  const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL required");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  console.log("[cleanup] Deleting fake DNR data S7-S12 2026...");
  const result = await client.mutation(api.dnr.deleteByWeekRange, {
    stationId: STATION_ID,
    yearFrom: 2026,
    weekFrom: 7,
    yearTo: 2026,
    weekTo: 12,
  });

  console.log(`[cleanup] Deleted ${result.deleted} fake investigations`);
  console.log("[cleanup] Done ✓");
}

main().catch((err) => {
  console.error("[cleanup] Fatal:", err);
  process.exit(1);
});
