#!/usr/bin/env npx tsx

/**
 * fetch-weekly.ts — pulls the weekly station report context from Convex.
 *
 * Exit codes: 0 = JSON written, 1 = no data, 2 = config error.
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
  const year = get("--year") ? Number(get("--year")) : undefined;
  const week = get("--week") ? Number(get("--week")) : undefined;
  const outDir = get("--out-dir") ?? ".artifacts/routines";
  if (year == null || week == null) {
    throw new Error("Missing --year and --week");
  }
  return { stationCode, year, week, outDir };
}

async function main() {
  const { stationCode, year, week, outDir } = parseArgs();

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[fetch-weekly] Missing NEXT_PUBLIC_CONVEX_URL env var");
    process.exit(2);
  }

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  console.log(`[fetch-weekly] station=${stationCode} year=${year} week=${week}`);

  const data = await client.query(api.reporting.getReportData, {
    stationCode,
    year,
    week,
  });

  if (!data) {
    console.error(`[fetch-weekly] no-data for ${stationCode} S${week}/${year}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const filepath = `${outDir}/weekly-${year}-w${week.toString().padStart(2, "0")}.json`;
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`[fetch-weekly] wrote ${filepath} — ${data.drivers.length} drivers, avg DWC ${data.kpis.avgDwc}%`);
  console.log(`[fetch-weekly] READY ${filepath}`);
}

main().catch((err) => {
  console.error("[fetch-weekly] unexpected error:", err);
  process.exit(2);
});
