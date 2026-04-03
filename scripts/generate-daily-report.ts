#!/usr/bin/env npx tsx

/**
 * generate-daily-report.ts — Daily report pipeline.
 *
 * Flow: query Convex daily data → AI synthesis (via --ai-file) → HTML template → store in Convex
 *
 * Usage:
 *   npx tsx scripts/generate-daily-report.ts --station-code FR-PSUA-DIF1 --date 2026-04-01
 *   npx tsx scripts/generate-daily-report.ts --station-code FR-PSUA-DIF1  # yesterday
 *   npx tsx scripts/generate-daily-report.ts --station-code FR-PSUA-DIF1 --ai-file /tmp/ai.json
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { DailyReportData, DailyReportDriver } from "../src/lib/pdf/daily-report-template";
import { generateDailyReportHtml } from "../src/lib/pdf/daily-report-template";
import * as fs from "node:fs";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const stationCode = get("--station-code") ?? "FR-PSUA-DIF1";
  const dateArg = get("--date");
  const outputDir = get("--output-dir") ?? ".artifacts/reports";
  const aiFile = get("--ai-file");
  const blurNames = args.includes("--blur-names");

  // Default to yesterday
  let date: string;
  if (dateArg) {
    date = dateArg;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split("T")[0];
  }

  return { stationCode, date, outputDir, aiFile, blurNames };
}

// ---------------------------------------------------------------------------
// Day label formatting
// ---------------------------------------------------------------------------

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const dayName = DAYS_FR[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const year = d.getFullYear();
  const suffix = day === 1 ? "er" : "";
  return `${dayName} ${day}${suffix} ${month} ${year}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // Step 1: Query daily data
  console.log(`[daily] querying data for ${opts.stationCode} ${opts.date}...`);
  const data = await client.query(api.reporting.getDailyReportData, {
    stationCode: opts.stationCode,
    date: opts.date,
  });

  if (!data) {
    console.error(`[daily] no data found for ${opts.stationCode} ${opts.date}`);
    process.exit(1);
  }

  console.log(`[daily] ${data.drivers.length} drivers, DWC avg ${data.kpis.avgDwc}%`);

  // Step 2: Load AI content if provided
  let aiSummary = "";
  if (opts.aiFile) {
    console.log(`[daily] loading AI content from ${opts.aiFile}...`);
    try {
      const raw = fs.readFileSync(opts.aiFile, "utf-8");
      const ai = JSON.parse(raw);
      aiSummary = ai.aiSummary ?? "";
      console.log("[daily] AI content loaded");
    } catch (err) {
      console.error("[daily] failed to load AI content:", err);
    }
  } else {
    console.log("[daily] no --ai-file provided, generating without AI summary");
  }

  // Step 3: Build DailyReportData
  const reportData: DailyReportData = {
    stationName: data.stationName,
    stationCode: data.stationCode,
    date: data.date,
    dayLabel: formatDayLabel(data.date),
    generatedAt: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
    kpis: data.kpis,
    weekProgress: data.weekProgress,
    drivers: data.drivers as DailyReportDriver[],
    absentDrivers: data.absentDrivers,
    aiSummary: aiSummary || undefined,
  };

  // Step 4: Generate HTML
  const html = generateDailyReportHtml(reportData, { blurNames: opts.blurNames });

  // Step 5: Save files
  fs.mkdirSync(opts.outputDir, { recursive: true });
  const filename = `daily-${opts.date}-${opts.stationCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
  const filepath = `${opts.outputDir}/${filename}`;
  fs.writeFileSync(filepath, html);
  console.log(`[daily] saved: ${filepath} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);

  // Step 6: Store in Convex
  console.log("[daily] storing in Convex...");
  const dateObj = new Date(opts.date);
  const weekNum = getISOWeek(dateObj);
  const year = dateObj.getFullYear();

  await client.mutation(api.reporting.storeReport, {
    stationId: data.stationId,
    reportType: "daily",
    logicalChannel: "reports_daily",
    audience: "manager",
    periodLabel: reportData.dayLabel,
    year,
    week: weekNum,
    title: `Rapport Quotidien — ${reportData.dayLabel}`,
    summary: aiSummary
      ? aiSummary.replace(/<[^>]*>/g, "").slice(0, 500)
      : `${data.drivers.length} livreurs, DWC ${data.kpis.avgDwc}%`,
    asciiContent: "",
    htmlContent: html,
    pdfStatus: "skipped",
    deliveryStatus: "pending",
    confidenceScore: aiSummary ? 0.85 : 0.5,
  });
  console.log("[daily] stored in Convex ✓");
  console.log("[daily] done ✓");
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

main();
