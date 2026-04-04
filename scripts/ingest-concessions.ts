#!/usr/bin/env npx tsx

/**
 * ingest-concessions.ts — Read concessions JSON and push to Convex.
 *
 * Usage:
 *   npx tsx scripts/ingest-concessions.ts \
 *     --artifacts-dir scraper/data/concessions/week-14-2026 \
 *     --station-code DIF1 \
 *     --organization-id org_xxx
 *
 * Env vars:
 *   CONVEX_URL / NEXT_PUBLIC_CONVEX_URL
 *   CONVEX_DEPLOY_KEY
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
    stationCode: get("--station-code") ?? "",
    organizationId: get("--organization-id") ?? process.env.CLERK_ORG_ID ?? "",
  };
}

async function main() {
  const { artifactsDir, stationCode, organizationId } = parseArgs();

  if (!artifactsDir || !stationCode) {
    console.error("Usage: --artifacts-dir <path> --station-code <code> [--organization-id <id>]");
    process.exit(1);
  }

  const jsonPath = path.join(artifactsDir, "concessions.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Read ${rawData.length} investigation(s) from ${jsonPath}`);

  if (rawData.length === 0) {
    console.log("Nothing to ingest.");
    return;
  }

  // Clean null values — Convex expects undefined (omit) for optional fields, not null
  function stripNulls<T>(obj: T): T {
    if (obj === null || obj === undefined) return undefined as T;
    if (Array.isArray(obj)) return obj.map(stripNulls) as T;
    if (typeof obj === "object") {
      const cleaned: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        if (val !== null && val !== undefined) {
          cleaned[key] = stripNulls(val);
        }
      }
      return cleaned as T;
    }
    return obj;
  }

  const raw = rawData.map(stripNulls);

  const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  // Ingest in batches of 15 to avoid mutation size limits
  const BATCH_SIZE = 15;
  let totalUpserted = 0;

  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batch = raw.slice(i, i + BATCH_SIZE);
    const result = await client.mutation(api.dnr.ingestConcessions, {
      organizationId,
      stationCode,
      investigations: batch,
    });
    totalUpserted += result.upserted;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.upserted} upserted`);
  }

  console.log(`Total: ${totalUpserted} investigation(s) upserted for ${stationCode}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
