#!/usr/bin/env npx tsx

/**
 * render-daily.ts — reads the daily JSON produced by `fetch-daily.ts`,
 * combines it with the routine's AI analysis (HTML paragraphs), renders
 * the final HTML via the existing `generateDailyReportHtml` template,
 * and stores the result in Convex via `api.reporting.storeReport`.
 *
 * The routine invokes this after producing its own aiSummary string.
 *
 * Exit codes:
 *   0 — report stored in Convex
 *   1 — JSON input file missing / unreadable
 *   2 — configuration error (missing env, Convex unreachable)
 *
 * Usage inside a routine:
 *   npx tsx scripts/routines/render-daily.ts \
 *     --date 2026-04-19 \
 *     --ai-file .artifacts/routines/ai-daily.json
 *
 * or equivalently with inline summary:
 *   npx tsx scripts/routines/render-daily.ts \
 *     --date 2026-04-19 \
 *     --ai-summary "<p>...</p><p>...</p>"
 */

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import {
  type DailyReportData,
  type DailyReportDriver,
  generateDailyReportHtml,
} from "../../src/lib/pdf/daily-report-template";
import * as fs from "node:fs";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const date = get("--date");
  const dataFile = get("--data-file") ?? (date ? `.artifacts/routines/daily-${date}.json` : undefined);
  const aiFile = get("--ai-file");
  const aiSummary = get("--ai-summary");
  const blurNames = args.includes("--blur-names");
  if (!date || !dataFile) {
    throw new Error("Missing --date");
  }
  return { date, dataFile, aiFile, aiSummary, blurNames };
}

// ---------------------------------------------------------------------------
// Date helpers (French + Amazon week)
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
  const day = d.getDate();
  const suffix = day === 1 ? "er" : "";
  return `${DAYS_FR[d.getDay()]} ${day}${suffix} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// Amazon week convention: Sunday starts the week, week 1 contains Jan 1.
function amazonWeek(dateStr: string): { year: number; week: number } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week1Sunday = new Date(jan1);
  week1Sunday.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());
  const diffDays = Math.floor((d.getTime() - week1Sunday.getTime()) / (24 * 60 * 60 * 1000));
  return { year, week: Math.floor(diffDays / 7) + 1 };
}

// ---------------------------------------------------------------------------
// AI summary loader
// ---------------------------------------------------------------------------

function loadAiSummary(opts: { aiFile?: string; aiSummary?: string }): string {
  if (opts.aiSummary) return opts.aiSummary;
  if (!opts.aiFile) return "";
  try {
    const raw = fs.readFileSync(opts.aiFile, "utf-8").trim();
    try {
      const j = JSON.parse(raw) as { aiSummary?: string };
      if (typeof j.aiSummary === "string") return j.aiSummary;
    } catch {
      // Treat raw text as the summary directly if not JSON.
    }
    return raw;
  } catch {
    console.warn(`[render-daily] could not read --ai-file ${opts.aiFile}, proceeding without AI summary`);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type FetchedDailyData = {
  stationId: string;
  stationName: string;
  stationCode: string;
  date: string;
  kpis: DailyReportData["kpis"];
  dnr?: DailyReportData["dnr"];
  weekProgress: DailyReportData["weekProgress"];
  drivers: DailyReportDriver[];
  absentDrivers: string[];
};

async function main() {
  const { date, dataFile, aiFile, aiSummary: aiArg, blurNames } = parseArgs();

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[render-daily] Missing NEXT_PUBLIC_CONVEX_URL env var");
    process.exit(2);
  }

  if (!fs.existsSync(dataFile)) {
    console.error(`[render-daily] data file not found: ${dataFile} — did fetch-daily.ts run?`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as FetchedDailyData;
  const aiSummary = loadAiSummary({ aiFile, aiSummary: aiArg });

  const reportData: DailyReportData = {
    stationName: data.stationName,
    stationCode: data.stationCode,
    date: data.date,
    dayLabel: formatDayLabel(data.date),
    generatedAt: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
    kpis: data.kpis,
    dnr: data.dnr ?? undefined,
    weekProgress: data.weekProgress,
    drivers: data.drivers,
    absentDrivers: data.absentDrivers,
    aiSummary: aiSummary || undefined,
  };

  const html = generateDailyReportHtml(reportData, { blurNames });
  const { year, week } = amazonWeek(date);

  const client = new ConvexHttpClient(convexUrl);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(deployKey);
  }

  await client.mutation(api.reporting.storeReport, {
    stationId: data.stationId as never,
    reportType: "daily",
    logicalChannel: "reports_daily",
    audience: "manager",
    periodLabel: reportData.dayLabel,
    year,
    week,
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

  console.log(
    `[render-daily] stored: "Rapport Quotidien — ${reportData.dayLabel}" (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`,
  );
  console.log(`[render-daily] SUCCESS ${date}`);
}

main().catch((err) => {
  console.error("[render-daily] unexpected error:", err);
  process.exit(2);
});
