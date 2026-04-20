#!/usr/bin/env npx tsx

/**
 * render-weekly.ts — reads the weekly JSON from fetch-weekly.ts,
 * combines it with the routine's AI synthesis (summary + recommendations
 * + optional per-driver notes), renders the final HTML and stores it
 * in Convex via api.reporting.storeReport.
 *
 * Exit codes: 0 success, 1 missing input, 2 config error.
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import {
  type DriverRecommendation,
  generateReportHtml,
  type ReportData,
  type ReportDriver,
  type WeeklyHistoryEntry,
} from "../../src/lib/pdf/report-template";
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
      ? `.artifacts/routines/weekly-${year}-w${week.toString().padStart(2, "0")}.json`
      : undefined);
  const aiFile = get("--ai-file");
  if (year == null || week == null || !dataFile) {
    throw new Error("Missing --year or --week");
  }
  return { year, week, dataFile, aiFile };
}

type AiContent = {
  aiSummary?: string;
  aiRecommendations?: string;
  driverRecommendations?: DriverRecommendation[];
};

function loadAi(aiFile?: string): AiContent {
  if (!aiFile) return {};
  try {
    const raw = fs.readFileSync(aiFile, "utf-8").trim();
    return JSON.parse(raw) as AiContent;
  } catch (err) {
    console.warn(`[render-weekly] could not parse --ai-file ${aiFile}:`, err);
    return {};
  }
}

type FetchedWeeklyData = {
  stationId: string;
  stationName: string;
  stationCode: string;
  kpis: ReportData["kpis"];
  dwcDistribution: ReportData["dwcDistribution"];
  drivers: Array<
    ReportDriver & {
      dwcTrend?: number;
    }
  >;
  weeklyHistory?: WeeklyHistoryEntry[];
  dnr?: ReportData["dnr"];
};

async function main() {
  const { year, week, dataFile, aiFile } = parseArgs();

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[render-weekly] Missing NEXT_PUBLIC_CONVEX_URL env var");
    process.exit(2);
  }

  if (!fs.existsSync(dataFile)) {
    console.error(`[render-weekly] data file not found: ${dataFile} — run fetch-weekly.ts first`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as FetchedWeeklyData;
  const ai = loadAi(aiFile);

  const top5 = data.drivers.slice(0, 5);
  const bottom5 = data.drivers.filter((d) => d.dwcPercent < 90).slice(-5);

  const templateData: ReportData = {
    stationName: data.stationName,
    stationCode: data.stationCode,
    week,
    year,
    generatedAt: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
    kpis: data.kpis,
    dwcDistribution: data.dwcDistribution,
    topDrivers: top5.map((d) => ({
      rank: d.rank,
      name: d.name,
      dwcPercent: d.dwcPercent,
      iadcPercent: d.iadcPercent,
      daysWorked: d.daysWorked,
      trend: d.dwcTrend ?? undefined,
    })),
    bottomDrivers: bottom5.map((d) => ({
      rank: d.rank,
      name: d.name,
      dwcPercent: d.dwcPercent,
      iadcPercent: d.iadcPercent,
      daysWorked: d.daysWorked,
      trend: d.dwcTrend ?? undefined,
    })),
    allDrivers: data.drivers.map((d) => ({
      rank: d.rank,
      name: d.name,
      dwcPercent: d.dwcPercent,
      iadcPercent: d.iadcPercent,
      daysWorked: d.daysWorked,
      trend: d.dwcTrend ?? undefined,
    })),
    aiSummary: ai.aiSummary || undefined,
    aiRecommendations: ai.aiRecommendations || undefined,
    driverRecommendations: ai.driverRecommendations?.length ? ai.driverRecommendations : undefined,
    weeklyHistory: data.weeklyHistory,
    dnr: data.dnr ?? undefined,
  };

  const html = generateReportHtml(templateData, { blurNames: false });

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  await client.mutation(api.reporting.storeReport, {
    stationId: data.stationId as never,
    reportType: "weekly",
    logicalChannel: "reports_weekly",
    audience: "manager",
    periodLabel: `S${week} ${year}`,
    year,
    week,
    title: `Rapport Hebdomadaire S${week} — ${data.stationCode}`,
    summary: ai.aiSummary
      ? ai.aiSummary.replace(/<[^>]*>/g, "").slice(0, 500)
      : `DWC ${data.kpis.avgDwc}%, ${data.kpis.activeDrivers} livreurs actifs`,
    asciiContent: `DWC: ${data.kpis.avgDwc}% | IADC: ${data.kpis.avgIadc}% | Drivers: ${data.kpis.activeDrivers}`,
    htmlContent: html,
    pdfStatus: "pending",
    deliveryStatus: "pending",
    confidenceScore: ai.aiSummary ? 0.9 : 0.6,
  });

  console.log(
    `[render-weekly] stored: "Rapport Hebdomadaire S${week} — ${data.stationCode}" (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`,
  );
  console.log(`[render-weekly] SUCCESS S${week}/${year}`);
}

main().catch((err) => {
  console.error("[render-weekly] unexpected error:", err);
  process.exit(2);
});
