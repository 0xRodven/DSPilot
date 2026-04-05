#!/usr/bin/env npx tsx

/**
 * ingest-investigations.ts — Read investigations JSON and push to Convex.
 *
 * Links investigations to existing DNR by trackingId (no duplicates).
 *
 * Usage:
 *   npx tsx scripts/ingest-investigations.ts \
 *     --artifacts-dir scraper/data/investigations/week-14-2026 \
 *     --station-code FR-PSUA-DIF1 \
 *     --organization-id org_xxx
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import * as fs from "node:fs";
import * as path from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };
  return {
    artifactsDir: get("--artifacts-dir") ?? "",
    stationCode: get("--station-code") ?? "FR-PSUA-DIF1",
    organizationId: get("--organization-id") ?? "",
  };
}

interface InvestigationEntry {
  trackingId: string;
  transporterId: string;
  driverName: string;
  year: number;
  week: number;
  deliveryDatetime: string;
  concessionDatetime: string;
  scanType?: string;
  investigationReason?: string;
  investigationDate?: string;
  investigationVerdict?: string;
  status: "under_investigation" | "investigation_closed";
}

async function main() {
  const opts = parseArgs();
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

  // Read investigations JSON
  const jsonPath = path.join(opts.artifactsDir, "investigations.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`[ingest-inv] File not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const entries: InvestigationEntry[] = JSON.parse(raw);
  console.log(`[ingest-inv] ${entries.length} investigation(s) to ingest`);

  if (entries.length === 0) {
    console.log("[ingest-inv] Nothing to ingest");
    return;
  }

  // Ingest in batches of 10
  const BATCH_SIZE = 10;
  let totalLinked = 0;
  let totalCreated = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const result = await client.mutation(api.dnr.ingestInvestigations, {
      organizationId: opts.organizationId,
      stationCode: opts.stationCode,
      entries: batch,
    });
    totalLinked += result.linked;
    totalCreated += result.created;
    console.log(
      `[ingest-inv] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.linked} linked, ${result.created} created`,
    );
  }

  console.log(`[ingest-inv] Done: ${totalLinked} linked to existing DNR, ${totalCreated} new entries`);
}

main().catch((err) => {
  console.error("[ingest-inv] Fatal:", err);
  process.exit(1);
});
