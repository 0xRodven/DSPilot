#!/usr/bin/env npx tsx

/**
 * fetch-daily.ts — pulls the daily report context from Convex and writes
 * it as JSON so a Claude Code routine can analyze it in its own reasoning
 * step before handing the result back to `render-daily.ts`.
 *
 * Exit codes:
 *   0 — JSON written, routine can proceed
 *   1 — no data for the requested date (expected on Sundays / before Amazon
 *       publishes yesterday's DWC). The routine should stop gracefully.
 *   2 — configuration error (missing env, Convex unreachable).
 *
 * Usage inside a routine:
 *   npx tsx scripts/routines/fetch-daily.ts --date 2026-04-19
 *   # reads NEXT_PUBLIC_CONVEX_URL, CONVEX_DEPLOY_KEY from env
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import * as fs from "node:fs";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const stationCode = get("--station-code") ?? process.env.DSPILOT_STATION_CODE ?? "FR-PSUA-DIF1";
  const date = get("--date") ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const outDir = get("--out-dir") ?? ".artifacts/routines";
  return { stationCode, date, outDir };
}

async function main() {
  const { stationCode, date, outDir } = parseArgs();

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[fetch-daily] Missing NEXT_PUBLIC_CONVEX_URL env var");
    process.exit(2);
  }

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  console.log(`[fetch-daily] station=${stationCode} date=${date}`);

  const data = await client.query(api.reporting.getDailyReportData, {
    stationCode,
    date,
  });

  if (!data) {
    console.error(`[fetch-daily] no-data for station=${stationCode} date=${date}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const filepath = `${outDir}/daily-${date}.json`;
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`[fetch-daily] wrote ${filepath} — ${data.drivers.length} drivers, avg DWC ${data.kpis.avgDwc}%`);
  // Sentinel line the routine can grep for to know the JSON is ready.
  console.log(`[fetch-daily] READY ${filepath}`);
}

main().catch((err) => {
  console.error("[fetch-daily] unexpected error:", err);
  process.exit(2);
});
