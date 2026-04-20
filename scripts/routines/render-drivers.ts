#!/usr/bin/env npx tsx

/**
 * render-drivers.ts — renders one HTML report per driver from the
 * driver-reports JSON + optional per-driver AI summaries, and stores
 * each into Convex's `driverReports` table via `storeDriverReport`.
 *
 * AI summaries are loaded from a directory where each file is named
 * `${driverId}.json` with shape `{ aiSummary: string }`. Drivers
 * without an AI file get a report without a summary.
 *
 * Exit codes: 0 = all stored, 1 = input missing, 2 = config error.
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import { type DriverReportData, generateDriverReportHtml } from "../../src/lib/pdf/driver-report-template";
import * as fs from "node:fs";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const year = get("--year") ? Number(get("--year")) : undefined;
  const week = get("--week") ? Number(get("--week")) : undefined;
  const dataFile =
    get("--data-file") ??
    (year != null && week != null
      ? `.artifacts/routines/drivers-${year}-w${week.toString().padStart(2, "0")}.json`
      : undefined);
  const aiDir = get("--ai-dir");
  const onlyDriverId = get("--driver-id");
  if (year == null || week == null || !dataFile) {
    throw new Error("Missing --year or --week");
  }
  return { year, week, dataFile, aiDir, onlyDriverId };
}

type FetchedDriversData = {
  stationId: string;
  stationName: string;
  stationCode: string;
  totalDrivers: number;
  drivers: Array<{
    driverId: string;
    driverName: string;
    rank: number;
    dwcPercent: number;
    iadcPercent: number;
    dwcChange?: number;
    totalDeliveries: number;
    daysWorked: number;
    history: DriverReportData["driver"]["history"];
    dailyPerformance?: DriverReportData["driver"]["dailyPerformance"];
    errorBreakdown?: DriverReportData["driver"]["errorBreakdown"];
    dnrEntries?: DriverReportData["driver"]["dnrEntries"];
    dnrByDay?: DriverReportData["driver"]["dnrByDay"];
    dnrCount?: number;
    investigationCount?: number;
  }>;
};

function loadDriverAi(aiDir: string | undefined, driverId: string): string | undefined {
  if (!aiDir) return undefined;
  const p = `${aiDir}/${driverId}.json`;
  if (!fs.existsSync(p)) return undefined;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf-8")) as { aiSummary?: string };
    return j.aiSummary;
  } catch {
    return undefined;
  }
}

async function main() {
  const { year, week, dataFile, aiDir, onlyDriverId } = parseArgs();

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[render-drivers] Missing NEXT_PUBLIC_CONVEX_URL");
    process.exit(2);
  }

  if (!fs.existsSync(dataFile)) {
    console.error(`[render-drivers] data file not found: ${dataFile}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as FetchedDriversData;
  const generatedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  const drivers = onlyDriverId ? data.drivers.filter((d) => d.driverId === onlyDriverId) : data.drivers;

  if (drivers.length === 0) {
    console.error(`[render-drivers] no drivers to render (onlyDriverId=${onlyDriverId ?? "none"})`);
    process.exit(1);
  }

  let stored = 0;
  for (const driver of drivers) {
    const aiSummary = loadDriverAi(aiDir, driver.driverId);

    const reportData: DriverReportData = {
      stationName: data.stationName,
      stationCode: data.stationCode,
      week,
      year,
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
    const summary = aiSummary
      ? aiSummary.replace(/<[^>]*>/g, "").slice(0, 500)
      : `DWC ${driver.dwcPercent}%, rang #${driver.rank}/${data.totalDrivers}, ${driver.daysWorked}j, ${driver.totalDeliveries} colis`;

    await client.mutation(api.reporting.storeDriverReport, {
      stationId: data.stationId as never,
      driverId: driver.driverId as never,
      year,
      week,
      driverName: driver.driverName,
      htmlContent: html,
      summary,
      aiSummary,
      dwcPercent: driver.dwcPercent,
      rank: driver.rank,
    });
    stored++;

    if (stored % 10 === 0 || stored === drivers.length) {
      console.log(`[render-drivers] stored ${stored}/${drivers.length}`);
    }
  }

  console.log(`[render-drivers] SUCCESS ${stored} driver reports stored for S${week}/${year}`);
}

main().catch((err) => {
  console.error("[render-drivers] unexpected error:", err);
  process.exit(2);
});
