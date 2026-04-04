#!/usr/bin/env npx tsx

/**
 * generate-driver-report.ts — Generate individual driver weekly report.
 *
 * Usage:
 *   npx tsx scripts/generate-driver-report.ts --station-code FR-PSUA-DIF1 --year 2026 --week 14
 *   npx tsx scripts/generate-driver-report.ts --station-code FR-PSUA-DIF1 --year 2026 --week 14 --driver-id xyz
 *   npx tsx scripts/generate-driver-report.ts --station-code FR-PSUA-DIF1 --ai-dir .artifacts/reports/driver-ai/
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { DriverReportData } from "../src/lib/pdf/driver-report-template";
import { generateDriverReportHtml } from "../src/lib/pdf/driver-report-template";
import * as fs from "node:fs";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  return {
    stationCode: get("--station-code") ?? "FR-PSUA-DIF1",
    year: Number(get("--year") ?? new Date().getFullYear()),
    week: Number(get("--week") ?? 1),
    outputDir: get("--output-dir") ?? ".artifacts/reports/drivers",
    aiDir: get("--ai-dir"),
    driverId: get("--driver-id"),
  };
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

  console.log(`[driver-report] Querying data for ${opts.stationCode} S${opts.week}/${opts.year}...`);
  const data = await client.query(api.reporting.getDriverReportData, {
    stationCode: opts.stationCode,
    year: opts.year,
    week: opts.week,
  });

  if (!data) {
    console.error(`[driver-report] No data found`);
    process.exit(1);
  }

  // Filter to specific driver if requested
  let drivers = data.drivers;
  if (opts.driverId) {
    drivers = drivers.filter((d) => d.driverId === opts.driverId);
    if (drivers.length === 0) {
      console.error(`[driver-report] Driver ${opts.driverId} not found`);
      process.exit(1);
    }
  }

  console.log(`[driver-report] Generating reports for ${drivers.length} drivers...`);

  fs.mkdirSync(opts.outputDir, { recursive: true });
  const generatedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  let generated = 0;

  for (const driver of drivers) {
    // Load AI summary if available
    let aiSummary: string | undefined;
    if (opts.aiDir) {
      const aiFile = `${opts.aiDir}/${driver.driverId}.json`;
      if (fs.existsSync(aiFile)) {
        try {
          const ai = JSON.parse(fs.readFileSync(aiFile, "utf-8"));
          aiSummary = ai.aiSummary ?? undefined;
        } catch { /* skip */ }
      }
    }

    const reportData: DriverReportData = {
      stationName: data.stationName,
      stationCode: data.stationCode,
      week: opts.week,
      year: opts.year,
      generatedAt,
      driver: {
        name: driver.driverName,
        rank: driver.rank,
        totalDrivers: data.totalDrivers,
        dwcPercent: driver.dwcPercent,
        iadcPercent: driver.iadcPercent,
        dwcChange: driver.dwcChange,
        totalDeliveries: driver.totalDeliveries,
        daysWorked: driver.daysWorked,
        history: driver.history,
        dailyPerformance: driver.dailyPerformance ?? [],
        errorBreakdown: driver.errorBreakdown ?? { contactMiss: 0, photoDefect: 0, rts: 0 },
        dnrEntries: driver.dnrEntries ?? [],
        dnrByDay: driver.dnrByDay ?? {},
        dnrCount: driver.dnrCount ?? 0,
        investigationCount: driver.investigationCount ?? 0,
      },
      aiSummary,
    };

    const html = generateDriverReportHtml(reportData);
    const slug = driver.driverName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const filename = `driver-s${opts.week}-${slug}.html`;
    const filepath = `${opts.outputDir}/${filename}`;
    fs.writeFileSync(filepath, html);
    generated++;

    if (generated % 10 === 0 || generated === drivers.length) {
      console.log(`[driver-report] ${generated}/${drivers.length} generated`);
    }
  }

  // Write manifest
  const manifest = drivers.map((d) => ({
    driverId: d.driverId,
    name: d.driverName,
    dwcPercent: d.dwcPercent,
    rank: d.rank,
    file: `driver-s${opts.week}-${d.driverName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}.html`,
  }));
  fs.writeFileSync(`${opts.outputDir}/manifest.json`, JSON.stringify(manifest, null, 2));

  console.log(`[driver-report] Done — ${generated} reports in ${opts.outputDir}`);
}

main().catch((err) => {
  console.error("[driver-report] Fatal:", err);
  process.exit(1);
});
