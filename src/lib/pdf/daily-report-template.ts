/**
 * daily-report-template.ts
 *
 * HTML template generator for daily station reports.
 * Designed for Chrome headless PDF rendering (or browser print-to-PDF).
 *
 * Design: SF Pro font, sharp corners, consulting-grade tables,
 * gradient DWC colors via inline styles.
 *
 * Single page, condensed layout — meant for quick morning review.
 */

import { getDwcColor } from "../utils/performance-color";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyReportDriver {
  rank: number;
  name: string;
  dwcPercent: number;
  totalDeliveries: number;
  dnrCount: number;
  photoDefects: number;
  rtsCount: number;
  isAlert: boolean; // DWC < 85%
}

export interface DailyReportData {
  stationName: string;
  stationCode: string;
  date: string; // "2026-04-01"
  dayLabel: string; // "Mardi 1er avril 2026"
  generatedAt: string;
  kpis: {
    activeDrivers: number;
    activeDriversChange?: number; // vs veille
    totalDelivered: number;
    avgDwc: number;
    dwcChange?: number;
    incidents: number;
  };
  weekProgress: {
    dayNumber: number; // 1-7
    weekDwcSoFar: number;
  };
  drivers: DailyReportDriver[];
  absentDrivers: string[]; // noms des absents
  aiSummary?: string; // HTML, comparaison vs veille
}

export interface DailyReportOptions {
  blurNames?: boolean;
}

// ---------------------------------------------------------------------------
// Embedded logo (64px DSPilot icon, base64 PNG)
// ---------------------------------------------------------------------------

const LOGO_BASE64 =
  "data:image/png;base64,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";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function blurName(name: string): string {
  return name
    .split(" ")
    .map((part) => (part.length > 0 ? `${part[0]}***` : ""))
    .join(" ");
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChange(value?: number): string {
  if (value === undefined || value === null) return "";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// CSS (single page, condensed)
// ---------------------------------------------------------------------------

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  font-size: 10px; line-height: 1.4; color: #1d1d1f; background: #fff;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; position: relative; }

/* Hero */
.hero { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #0891b2 100%); color: #fff; padding: 20px 36px 16px; }
.hero-top { display: flex; justify-content: space-between; align-items: center; }
.hero-brand { display: flex; align-items: center; gap: 10px; }
.hero-brand img { height: 28px; width: auto; }
.hero-wordmark { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.hero-meta { text-align: right; font-size: 10px; opacity: 0.7; line-height: 1.5; }
.hero-title { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin: 12px 0 2px; }
.hero-subtitle { font-size: 11px; opacity: 0.75; }

/* Body */
.body { padding: 18px 36px 60px; }

/* KPIs */
.kpis { display: flex; border-bottom: 1px solid #d2d2d7; margin-bottom: 16px; padding-bottom: 14px; }
.kpi { flex: 1; padding: 0 14px; border-right: 1px solid #e8e8ed; }
.kpi:first-child { padding-left: 0; }
.kpi:last-child { padding-right: 0; border-right: none; }
.kpi-label { font-size: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: #6e6e73; margin-bottom: 2px; }
.kpi-value { font-size: 22px; font-weight: 600; color: #1d1d1f; line-height: 1.1; font-variant-numeric: tabular-nums; }
.kpi-delta { font-size: 9px; font-weight: 450; margin-top: 2px; }
.up { color: #059669; } .down { color: #dc2626; } .muted { color: #a1a1a6; }

/* AI Box — Synthesis */
.ai-box { background: #f0f4ff; border-left: 3px solid #2563eb; padding: 14px 18px; margin-bottom: 16px; }
.ai-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb; margin-bottom: 6px; }
.ai-text { font-size: 11px; line-height: 1.7; color: #1e3a5f; }
.ai-text strong { font-weight: 600; }

/* Section */
.section { margin-bottom: 16px; }
.section-head { margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #1d1d1f; }
.section-eyebrow { font-size: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1a6; }
.section-title { font-size: 13px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em; line-height: 1.3; }

/* Alert box (orange/red) */
.alert-box { background: #fef3e6; border-left: 3px solid #f97316; padding: 12px 16px; margin-bottom: 16px; }
.alert-box.critical { background: #fee2e2; border-color: #ef4444; }
.alert-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #b45309; margin-bottom: 6px; }
.alert-box.critical .alert-label { color: #dc2626; }
.alert-list { list-style: none; padding: 0; margin: 0; }
.alert-item { font-size: 10px; color: #1d1d1f; padding: 4px 0; border-bottom: 1px solid #fde6d5; display: flex; justify-content: space-between; }
.alert-box.critical .alert-item { border-color: #fecaca; }
.alert-item:last-child { border-bottom: none; }
.alert-name { font-weight: 500; }
.alert-metrics { color: #6e6e73; font-variant-numeric: tabular-nums; }

/* Success box (green) */
.success-box { background: #ecfdf5; border-left: 3px solid #10b981; padding: 12px 16px; margin-bottom: 16px; }
.success-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #059669; margin-bottom: 6px; }
.success-list { list-style: none; padding: 0; margin: 0; }
.success-item { font-size: 10px; color: #1d1d1f; padding: 4px 0; border-bottom: 1px solid #d1fae5; display: flex; justify-content: space-between; }
.success-item:last-child { border-bottom: none; }
.success-name { font-weight: 500; }
.success-metrics { color: #059669; font-weight: 600; font-variant-numeric: tabular-nums; }

/* Absent list */
.absent-box { background: #f5f5f7; padding: 10px 14px; margin-bottom: 16px; border-radius: 2px; }
.absent-label { font-size: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #6e6e73; margin-bottom: 4px; }
.absent-list { font-size: 10px; color: #a1a1a6; line-height: 1.6; }

/* Week progress bar */
.week-progress { background: #f5f5f7; padding: 12px 16px; margin-bottom: 16px; }
.week-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.week-progress-label { font-size: 10px; font-weight: 500; color: #1d1d1f; }
.week-progress-value { font-size: 12px; font-weight: 600; color: #1d1d1f; }
.week-progress-bar { height: 8px; background: #e8e8ed; border-radius: 4px; overflow: hidden; }
.week-progress-fill { height: 100%; border-radius: 4px; }

/* Table */
table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
col.c-rank { width: 28px; } col.c-name { width: auto; } col.c-num { width: 52px; } col.c-status { width: 50px; }
thead th { font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6e6e73; padding: 5px 6px; border-bottom: 1.5px solid #1d1d1f; text-align: left; }
thead th.r { text-align: right; }
thead th.c { text-align: center; }
tbody td { padding: 5px 6px; border-bottom: 1px solid #e8e8ed; vertical-align: middle; }
tbody tr:last-child td { border-bottom: 1.5px solid #d2d2d7; }
td.rank { font-variant-numeric: tabular-nums; font-size: 9px; color: #a1a1a6; }
td.name { font-weight: 500; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
td.r { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
td.c { text-align: center; }
.status-ok { color: #059669; font-weight: 600; font-size: 9px; }
.status-alert { color: #dc2626; font-weight: 600; font-size: 9px; }

/* Footer */
.foot { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 36px; display: flex; justify-content: space-between; font-size: 7px; color: #a1a1a6; border-top: 1px solid #e8e8ed; }
.foot-brand { font-weight: 500; color: #2563eb; }
`;

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function renderDriverRow(d: DailyReportDriver): string {
  const statusClass = d.isAlert ? "status-alert" : "status-ok";
  const statusText = d.isAlert ? "Alerte" : "OK";
  return `<tr>
    <td class="rank">${String(d.rank).padStart(2, "0")}</td>
    <td class="name">${escapeHtml(d.name)}</td>
    <td class="r" style="color:${getDwcColor(d.dwcPercent)}">${formatPercent(d.dwcPercent)}</td>
    <td class="r">${formatNumber(d.totalDeliveries)}</td>
    <td class="r">${d.dnrCount}</td>
    <td class="r">${d.photoDefects}</td>
    <td class="r">${d.rtsCount}</td>
    <td class="c ${statusClass}">${statusText}</td>
  </tr>`;
}

function renderTableHead(): string {
  return `<colgroup><col class="c-rank"><col class="c-name"><col class="c-num"><col class="c-num"><col class="c-num"><col class="c-num"><col class="c-num"><col class="c-status"></colgroup>
  <thead><tr><th>#</th><th>Livreur</th><th class="r">DWC</th><th class="r">Colis</th><th class="r">DNR</th><th class="r">Photos</th><th class="r">RTS</th><th class="c">Status</th></tr></thead>`;
}

function renderFooter(generatedAt: string): string {
  return `<div class="foot">
    <span class="foot-brand">DSPilot — dspilot.fr</span>
    <span>Confidentiel — Usage interne DSP</span>
    <span>Genere le ${escapeHtml(generatedAt)}</span>
  </div>`;
}

function renderWeekProgressBar(dayNumber: number, weekDwcSoFar: number): string {
  const progressPercent = (dayNumber / 7) * 100;
  const color = getDwcColor(weekDwcSoFar);
  return `<div class="week-progress">
    <div class="week-progress-header">
      <span class="week-progress-label">Jour ${dayNumber}/7 — DWC cumule semaine</span>
      <span class="week-progress-value" style="color:${color}">${formatPercent(weekDwcSoFar)}</span>
    </div>
    <div class="week-progress-bar">
      <div class="week-progress-fill" style="width:${progressPercent}%;background:${color};"></div>
    </div>
  </div>`;
}

function renderAlertBox(alertDrivers: DailyReportDriver[], blurFn: (n: string) => string): string {
  if (alertDrivers.length === 0) return "";
  const isCritical = alertDrivers.some((d) => d.dwcPercent < 80);
  const boxClass = isCritical ? "alert-box critical" : "alert-box";
  const items = alertDrivers
    .map(
      (d) =>
        `<li class="alert-item"><span class="alert-name">${escapeHtml(blurFn(d.name))}</span><span class="alert-metrics">DWC ${formatPercent(d.dwcPercent)} | DNR ${d.dnrCount} | Photos ${d.photoDefects}</span></li>`,
    )
    .join("");
  return `<div class="${boxClass}">
    <div class="alert-label">Alertes du jour — ${alertDrivers.length} livreur${alertDrivers.length > 1 ? "s" : ""} sous 85%</div>
    <ul class="alert-list">${items}</ul>
  </div>`;
}

function renderTop3Box(topDrivers: DailyReportDriver[], blurFn: (n: string) => string): string {
  if (topDrivers.length === 0) return "";
  const items = topDrivers
    .slice(0, 3)
    .map(
      (d) =>
        `<li class="success-item"><span class="success-name">${escapeHtml(blurFn(d.name))}</span><span class="success-metrics">${formatPercent(d.dwcPercent)}</span></li>`,
    )
    .join("");
  return `<div class="success-box">
    <div class="success-label">Top 3 du jour</div>
    <ul class="success-list">${items}</ul>
  </div>`;
}

function renderAbsentBox(absentDrivers: string[], blurFn: (n: string) => string): string {
  if (absentDrivers.length === 0) return "";
  const names = absentDrivers.map((n) => escapeHtml(blurFn(n))).join(", ");
  return `<div class="absent-box">
    <div class="absent-label">Absents du jour (${absentDrivers.length})</div>
    <div class="absent-list">${names}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDailyReportHtml(data: DailyReportData, options: DailyReportOptions = {}): string {
  const { blurNames = false } = options;
  const blur = blurNames ? blurName : (n: string) => n;

  const drivers = data.drivers.map((d) => ({ ...d, name: blur(d.name) }));
  const absentDrivers = data.absentDrivers.map((n) => blur(n));

  const alertDrivers = drivers.filter((d) => d.isAlert);
  const topDrivers = [...drivers].sort((a, b) => b.dwcPercent - a.dwcPercent);

  const versionLabel = blurNames ? " | Version Livreurs" : "";

  const page = `<div class="page">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-brand">
          <img src="${LOGO_BASE64}" alt="DSPilot">
          <span class="hero-wordmark">DSPilot</span>
        </div>
        <div class="hero-meta">Station ${escapeHtml(data.stationCode)}<br>${escapeHtml(data.generatedAt)}</div>
      </div>
      <div class="hero-title">Rapport Quotidien — ${escapeHtml(data.dayLabel)}${versionLabel}</div>
      <div class="hero-subtitle">${escapeHtml(data.stationName)} · ${data.kpis.activeDrivers} livreurs actifs</div>
    </div>
    <div class="body">
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Livreurs actifs</div>
          <div class="kpi-value">${data.kpis.activeDrivers}</div>
          ${data.kpis.activeDriversChange !== undefined ? `<div class="kpi-delta ${data.kpis.activeDriversChange >= 0 ? "up" : "down"}">${formatChange(data.kpis.activeDriversChange)} vs veille</div>` : ""}
        </div>
        <div class="kpi">
          <div class="kpi-label">Colis livres</div>
          <div class="kpi-value">${formatNumber(data.kpis.totalDelivered)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Score DWC</div>
          <div class="kpi-value" style="color:${getDwcColor(data.kpis.avgDwc)}">${formatPercent(data.kpis.avgDwc)}</div>
          ${data.kpis.dwcChange !== undefined ? `<div class="kpi-delta ${data.kpis.dwcChange >= 0 ? "up" : "down"}">${formatChange(data.kpis.dwcChange)}pp vs veille</div>` : ""}
        </div>
        <div class="kpi">
          <div class="kpi-label">Incidents</div>
          <div class="kpi-value">${data.kpis.incidents}</div>
          <div class="kpi-delta muted">DNR + Photos + Contact</div>
        </div>
      </div>

      ${data.aiSummary ? `<div class="ai-box"><div class="ai-label">Synthese du jour</div><div class="ai-text">${data.aiSummary}</div></div>` : ""}

      ${renderWeekProgressBar(data.weekProgress.dayNumber, data.weekProgress.weekDwcSoFar)}

      ${renderAlertBox(alertDrivers, (n) => n)}

      ${renderTop3Box(topDrivers, (n) => n)}

      ${renderAbsentBox(absentDrivers, (n) => n)}

      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Detail</div>
          <div class="section-title">Tableau complet du jour — ${drivers.length} livreurs</div>
        </div>
        <table>${renderTableHead()}<tbody>${drivers.map((d) => renderDriverRow(d)).join("")}</tbody></table>
      </div>
    </div>
    ${renderFooter(data.generatedAt)}
  </div>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>DSPilot - Rapport Quotidien ${data.date}</title><style>${CSS}</style></head><body>${page}</body></html>`;
}
