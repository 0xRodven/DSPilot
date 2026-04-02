/**
 * report-template.ts
 *
 * HTML template generator for weekly station reports.
 * Designed for Chrome headless PDF rendering (or browser print-to-PDF).
 *
 * Design: SF Pro font, sharp corners, consulting-grade tables,
 * gradient DWC colors via inline styles.
 */

import { getDwcColor } from "../utils/performance-color";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportDriver {
  rank: number;
  name: string;
  dwcPercent: number;
  iadcPercent: number;
  daysWorked: number;
  /** Trend vs previous week in pp (e.g. +2.3 or -1.5). Optional. */
  trend?: number;
}

export interface WeeklyHistoryEntry {
  week: number;
  year: number;
  avgDwc: number;
  avgIadc: number;
}

export interface ReportData {
  stationName: string;
  stationCode: string;
  week: number;
  year: number;
  generatedAt: string;
  kpis: {
    avgDwc: number;
    avgIadc: number;
    totalDrivers: number;
    activeDrivers: number;
    dwcChange?: number;
    iadcChange?: number;
    totalDelivered?: number;
    avgDnrDpmo?: number;
    avgRtsPercent?: number;
  };
  dwcDistribution: {
    above95: number;
    pct90to95: number;
    pct85to90: number;
    pct80to85: number;
    below80: number;
  };
  topDrivers: ReportDriver[];
  bottomDrivers: ReportDriver[];
  /** All drivers for the full table (page 2+). Optional — if omitted only top/bottom are shown. */
  allDrivers?: ReportDriver[];
  /** AI summary — rendered as HTML (supports <strong>, <br>, etc.) */
  aiSummary?: string;
  /** AI recommendations — rendered as HTML (supports <strong>, <br>, etc.) */
  aiRecommendations?: string;
  /** Per-driver recommendations with "why" explanations */
  driverRecommendations?: DriverRecommendation[];
  /** DWC history for the last 8 weeks (for trend chart). Optional. */
  weeklyHistory?: WeeklyHistoryEntry[];
}

export interface DriverRecommendation {
  name: string;
  recommendation: string;
  why: string;
}

export interface ReportOptions {
  /** Blur driver names for privacy: "Jean Dupont" -> "J*** D***" */
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
  return `${sign}${value.toFixed(1)}pp`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Distribution bar colors
// ---------------------------------------------------------------------------

const DIST_COLORS = {
  above95: "#059669",
  pct90to95: "#3b82f6",
  pct85to90: "#f59e0b",
  pct80to85: "#f97316",
  below80: "#ef4444",
};

const DIST_LABELS = {
  above95: "≥ 95%",
  pct90to95: "90–95%",
  pct85to90: "85–90%",
  pct80to85: "80–85%",
  below80: "< 80%",
};

// ---------------------------------------------------------------------------
// CSS (shared across pages)
// ---------------------------------------------------------------------------

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  font-size: 11px; line-height: 1.5; color: #1d1d1f; background: #fff;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; position: relative; page-break-after: always; }
.page:last-child { page-break-after: auto; }

/* Hero */
.hero { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #0891b2 100%); color: #fff; padding: 24px 40px 20px; }
.hero-top { display: flex; justify-content: space-between; align-items: center; }
.hero-brand { display: flex; align-items: center; gap: 12px; }
.hero-brand img { height: 32px; width: auto; }
.hero-wordmark { font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }
.hero-meta { text-align: right; font-size: 11px; opacity: 0.7; line-height: 1.6; }
.hero-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin: 16px 0 3px; }
.hero-subtitle { font-size: 12px; opacity: 0.75; }

/* Body */
.body { padding: 24px 40px 72px; }

/* KPIs */
.kpis { display: flex; border-bottom: 1px solid #d2d2d7; margin-bottom: 24px; padding-bottom: 18px; }
.kpi { flex: 1; padding: 0 16px; border-right: 1px solid #e8e8ed; }
.kpi:first-child { padding-left: 0; }
.kpi:last-child { padding-right: 0; border-right: none; }
.kpi-label { font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: #6e6e73; margin-bottom: 2px; }
.kpi-value { font-size: 26px; font-weight: 600; color: #1d1d1f; line-height: 1.1; font-variant-numeric: tabular-nums; }
.kpi-delta { font-size: 10px; font-weight: 450; margin-top: 3px; }
.up { color: #059669; } .down { color: #dc2626; } .muted { color: #a1a1a6; }

/* AI Box — Synthesis (larger, more prominent) */
.ai-box { background: #f0f4ff; border-left: 3px solid #2563eb; padding: 20px 24px; margin-bottom: 24px; }
.ai-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb; margin-bottom: 8px; }
.ai-text { font-size: 12px; line-height: 1.8; color: #1e3a5f; }
.ai-text strong { font-weight: 600; }

/* Weekly history chart (8-week DWC trend) */
.history-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 100px; gap: 8px; margin-top: 12px; }
.history-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; }
.history-bar-value { font-size: 9px; font-weight: 600; color: #1d1d1f; margin-bottom: 4px; }
.history-bar { width: 100%; min-height: 4px; border-radius: 2px 2px 0 0; }
.history-bar-week { font-size: 8px; color: #6e6e73; margin-top: 4px; font-weight: 500; }

/* Section */
.section { margin-bottom: 24px; }
.section-head { margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1.5px solid #1d1d1f; }
.section-eyebrow { font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1a6; }
.section-title { font-size: 15px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em; line-height: 1.3; }

/* Distribution */
.dist-wrapper { margin-bottom: 8px; }
.dist-labels { display: flex; margin-bottom: 4px; }
.dist-label { display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: 500; color: #6e6e73; }
.dist-bar { display: flex; height: 24px; overflow: hidden; gap: 1px; }
.dist-seg { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: #fff; }

/* Table */
table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
col.c-rank { width: 32px; } col.c-name { width: auto; } col.c-num { width: 56px; } col.c-days { width: 42px; } col.c-trend { width: 52px; }
thead th { font-weight: 500; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6e6e73; padding: 6px 8px; border-bottom: 1.5px solid #1d1d1f; text-align: left; }
thead th.r { text-align: right; }
tbody td { padding: 7px 8px; border-bottom: 1px solid #e8e8ed; vertical-align: middle; }
tbody tr:last-child td { border-bottom: 1.5px solid #d2d2d7; }
td.rank { font-variant-numeric: tabular-nums; font-size: 10px; color: #a1a1a6; }
td.name { font-weight: 500; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
td.r { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }

/* Footer */
.foot { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 40px; display: flex; justify-content: space-between; font-size: 8px; color: #a1a1a6; border-top: 1px solid #e8e8ed; }
.foot-brand { font-weight: 500; color: #2563eb; }

/* Driver reco list */
.reco-list { list-style: none; padding: 0; }
.reco-item { padding: 10px 0; border-bottom: 1px solid #e8e8ed; }
.reco-item:last-child { border-bottom: none; }
.reco-name { font-weight: 600; color: #1d1d1f; font-size: 12px; }
.reco-text { font-size: 11px; color: #1e3a5f; margin-top: 2px; }
.reco-why { font-size: 10px; color: #6e6e73; margin-top: 2px; font-style: italic; }

/* Lexique */
.lex-grid { display: grid; grid-template-columns: 120px 1fr; gap: 0; }
.lex-term { font-weight: 600; color: #1d1d1f; padding: 8px 12px 8px 0; border-bottom: 1px solid #e8e8ed; font-size: 11px; }
.lex-def { color: #3a3a3c; padding: 8px 0; border-bottom: 1px solid #e8e8ed; font-size: 11px; line-height: 1.5; }

/* Page header (pages 2+) */
.page-head { padding: 16px 40px; border-bottom: 1px solid #e8e8ed; display: flex; justify-content: space-between; align-items: center; }
.page-head-brand { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #2563eb; }
.page-head-brand img { height: 20px; width: 20px; }
.page-head-meta { font-size: 10px; color: #a1a1a6; }
`;

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function formatTrend(trend?: number): string {
  if (trend === undefined || trend === null) return '<span style="color:#a1a1a6;">—</span>';
  const isStable = Math.abs(trend) < 0.5;
  if (isStable) return '<span style="color:#a1a1a6;">→ 0pp</span>';
  const isUp = trend >= 0.5;
  const arrow = isUp ? "↑" : "↓";
  const color = isUp ? "#059669" : "#dc2626";
  const sign = trend > 0 ? "+" : "";
  return `<span style="color:${color};">${arrow} ${sign}${trend.toFixed(1)}pp</span>`;
}

function renderDriverRow(d: ReportDriver, includeTrend = true): string {
  const trendCell = includeTrend ? `<td class="r">${formatTrend(d.trend)}</td>` : "";
  return `<tr>
    <td class="rank">${String(d.rank).padStart(2, "0")}</td>
    <td class="name">${escapeHtml(d.name)}</td>
    <td class="r" style="color:${getDwcColor(d.dwcPercent)}">${formatPercent(d.dwcPercent)}</td>
    ${trendCell}
    <td class="r">${formatPercent(d.iadcPercent)}</td>
    <td class="r">${d.daysWorked}</td>
  </tr>`;
}

function renderTableHead(includeTrend = true): string {
  const trendCol = includeTrend ? '<col class="c-trend">' : "";
  const trendTh = includeTrend ? '<th class="r">Trend</th>' : "";
  return `<colgroup><col class="c-rank"><col class="c-name"><col class="c-num">${trendCol}<col class="c-num"><col class="c-days"></colgroup>
  <thead><tr><th>#</th><th>Livreur</th><th class="r">DWC</th>${trendTh}<th class="r">IADC</th><th class="r">Jours</th></tr></thead>`;
}

function renderFooter(page: number, totalPages: number, generatedAt: string): string {
  return `<div class="foot">
    <span class="foot-brand">DSPilot — dspilot.fr</span>
    <span>Confidentiel — Usage interne DSP</span>
    <span>Généré le ${escapeHtml(generatedAt)}</span>
    <span>Page ${page}/${totalPages}</span>
  </div>`;
}

function renderPageHead(): string {
  return `<div class="page-head">
    <div class="page-head-brand"><img src="${LOGO_BASE64}" alt="">DSPilot</div>
    <div class="page-head-meta">Rapport de Performance Hebdomadaire</div>
  </div>`;
}

function renderWeeklyHistoryChart(history: WeeklyHistoryEntry[]): string {
  if (!history || history.length === 0) return "";

  // Sort by year/week ascending
  const sorted = [...history].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week - b.week;
  });

  // Take last 8 weeks max
  const last8 = sorted.slice(-8);
  if (last8.length === 0) return "";

  // Find min/max for scaling (leave some headroom)
  const values = last8.map((h) => h.avgDwc);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = Math.max(maxVal - minVal, 2); // at least 2pp range
  const chartMin = Math.max(minVal - 1, 70); // don't go below 70%
  const chartMax = Math.min(maxVal + 1, 100); // don't go above 100%
  const chartRange = chartMax - chartMin;

  const bars = last8
    .map((h) => {
      const heightPct = chartRange > 0 ? ((h.avgDwc - chartMin) / chartRange) * 100 : 50;
      const height = Math.max(heightPct, 5); // minimum 5% height for visibility
      const color = getDwcColor(h.avgDwc);
      return `<div class="history-bar-wrapper">
      <div class="history-bar-value">${h.avgDwc.toFixed(1)}%</div>
      <div class="history-bar" style="height:${height}%;background:${color};"></div>
      <div class="history-bar-week">S${h.week}</div>
    </div>`;
    })
    .join("");

  return `<div class="section">
    <div class="section-head">
      <div class="section-eyebrow">Exhibit 1</div>
      <div class="section-title">Évolution DWC — ${last8.length} dernières semaines</div>
    </div>
    <div class="history-chart">${bars}</div>
  </div>`;
}

function renderDriverRecommendations(recos: DriverRecommendation[], blurFn: (n: string) => string): string {
  if (recos.length === 0) return "";
  const items = recos
    .map(
      (r) => `<li class="reco-item">
    <div class="reco-name">${escapeHtml(blurFn(r.name))}</div>
    <div class="reco-text">${r.recommendation}</div>
    <div class="reco-why">Pourquoi : ${r.why}</div>
  </li>`,
    )
    .join("");
  return `<div class="ai-box" style="background:#fef9ee;border-color:#f59e0b;">
    <div class="ai-label" style="color:#b45309;">✦ Recommandations par livreur</div>
    <ul class="reco-list">${items}</ul>
  </div>`;
}

function renderLexiquePage(pageNum: number, totalPages: number, generatedAt: string): string {
  const terms = [
    [
      "DWC",
      "Delivery With Care — Score global de qualité de livraison calculé par Amazon. Inclut la ponctualité, le respect des consignes de livraison, et la satisfaction client.",
    ],
    [
      "IADC",
      "Incident And Defect Count — Score mesurant les incidents (colis perdus, endommagés, retournés) rapporté au nombre total de livraisons.",
    ],
    [
      "DNR DPMO",
      "Did Not Receive Defects Per Million Opportunities — Nombre de réclamations 'colis non reçu' pour un million de livraisons.",
    ],
    ["RTS", "Return To Station — Pourcentage de colis ramenés à la station sans avoir été livrés."],
    ["Scorecard", "Rapport de performance hebdomadaire généré par Amazon pour chaque DSP et chaque livreur."],
    [
      "DSP",
      "Delivery Service Partner — Entreprise partenaire d'Amazon responsable de la livraison du dernier kilomètre.",
    ],
    ["Station", "Centre de distribution Amazon depuis lequel les livreurs partent chaque jour avec leurs colis."],
    [
      "Semaine ISO",
      "Numérotation internationale des semaines (ISO 8601). La semaine 1 est celle qui contient le premier jeudi de l'année.",
    ],
    [
      "Coaching",
      "Accompagnement individuel d'un livreur pour améliorer ses performances. Peut inclure un entretien, un rappel des bonnes pratiques, ou un plan d'action.",
    ],
    [
      "pp",
      "Points de pourcentage — Unité de mesure de la variation entre deux pourcentages (ex: passer de 90% à 92% = +2pp).",
    ],
  ];
  const rows = terms.map(([t, d]) => `<div class="lex-term">${t}</div><div class="lex-def">${d}</div>`).join("");
  return `<div class="page">
    ${renderPageHead()}
    <div class="body" style="padding-top:20px;">
      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Référence</div>
          <div class="section-title">Lexique</div>
        </div>
        <div class="lex-grid">${rows}</div>
      </div>
    </div>
    ${renderFooter(pageNum, totalPages, generatedAt)}
  </div>`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateReportHtml(data: ReportData, options: ReportOptions = {}): string {
  const { blurNames = false } = options;
  const blur = blurNames ? blurName : (n: string) => n;

  const topDrivers = data.topDrivers.map((d) => ({ ...d, name: blur(d.name) }));
  const bottomDrivers = data.bottomDrivers.map((d) => ({ ...d, name: blur(d.name) }));
  const allDrivers = data.allDrivers?.map((d) => ({ ...d, name: blur(d.name) }));

  const dist = data.dwcDistribution;
  const distTotal = dist.above95 + dist.pct90to95 + dist.pct85to90 + dist.pct80to85 + dist.below80 || 1;
  const versionLabel = blurNames ? " | Version Livreurs" : "";

  const driverRecos = data.driverRecommendations?.map((r) => ({ ...r, name: blur(r.name) })) ?? [];
  const hasAllDrivers = allDrivers && allDrivers.length > 0;
  const dataPages = hasAllDrivers ? Math.ceil(allDrivers.length / 30) : 0;
  const totalPages = 1 + dataPages + 1; // page 1 + data pages + lexique

  // Build distribution segments
  const segments = [
    { key: "above95" as const, count: dist.above95 },
    { key: "pct90to95" as const, count: dist.pct90to95 },
    { key: "pct85to90" as const, count: dist.pct85to90 },
    { key: "pct80to85" as const, count: dist.pct80to85 },
    { key: "below80" as const, count: dist.below80 },
  ].filter((s) => s.count > 0);

  const distLabelsHtml = segments
    .map((s) => `<div class="dist-label" style="flex:${s.count};">${DIST_LABELS[s.key]}</div>`)
    .join("");

  const distBarHtml = segments
    .map((s) => `<div class="dist-seg" style="flex:${s.count};background:${DIST_COLORS[s.key]};">${s.count}</div>`)
    .join("");

  // PAGE 1: Overview
  const page1 = `<div class="page">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-brand">
          <img src="${LOGO_BASE64}" alt="DSPilot">
          <span class="hero-wordmark">DSPilot</span>
        </div>
        <div class="hero-meta">Station ${escapeHtml(data.stationCode)}<br>${escapeHtml(data.generatedAt)}</div>
      </div>
      <div class="hero-title">Rapport Hebdomadaire — Semaine ${data.week}${versionLabel}</div>
      <div class="hero-subtitle">${escapeHtml(data.stationName)} · ${data.year} · ${data.kpis.activeDrivers} livreurs actifs sur ${data.kpis.totalDrivers}</div>
    </div>
    <div class="body">
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Score DWC</div>
          <div class="kpi-value">${formatPercent(data.kpis.avgDwc)}</div>
          ${data.kpis.dwcChange !== undefined ? `<div class="kpi-delta ${data.kpis.dwcChange >= 0 ? "up" : "down"}">${formatChange(data.kpis.dwcChange)} vs S${data.week - 1}</div>` : ""}
        </div>
        <div class="kpi">
          <div class="kpi-label">Score IADC</div>
          <div class="kpi-value">${formatPercent(data.kpis.avgIadc)}</div>
          ${data.kpis.iadcChange !== undefined ? `<div class="kpi-delta ${data.kpis.iadcChange >= 0 ? "up" : "down"}">${formatChange(data.kpis.iadcChange)} vs S${data.week - 1}</div>` : ""}
        </div>
        <div class="kpi">
          <div class="kpi-label">Livreurs actifs</div>
          <div class="kpi-value">${data.kpis.activeDrivers}</div>
          <div class="kpi-delta muted">sur ${data.kpis.totalDrivers} inscrits</div>
        </div>
        ${data.kpis.totalDelivered !== undefined ? `<div class="kpi"><div class="kpi-label">Colis livrés</div><div class="kpi-value">${formatNumber(data.kpis.totalDelivered)}</div></div>` : ""}
        ${data.kpis.avgDnrDpmo !== undefined ? `<div class="kpi"><div class="kpi-label">DNR DPMO</div><div class="kpi-value">${formatNumber(data.kpis.avgDnrDpmo)}</div></div>` : ""}
      </div>

      ${data.aiSummary ? `<div class="ai-box"><div class="ai-label">✦ Synthèse de la semaine</div><div class="ai-text">${data.aiSummary}</div></div>` : ""}

      ${data.weeklyHistory && data.weeklyHistory.length > 1 ? renderWeeklyHistoryChart(data.weeklyHistory) : ""}

      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Exhibit ${data.weeklyHistory && data.weeklyHistory.length > 1 ? "2" : "1"}</div>
          <div class="section-title">Distribution DWC% — ${dist.above95 + dist.pct90to95} livreurs à 90% ou plus</div>
        </div>
        <div class="dist-wrapper">
          <div class="dist-labels">${distLabelsHtml}</div>
          <div class="dist-bar">${distBarHtml}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-head"><div class="section-eyebrow">Exhibit ${data.weeklyHistory && data.weeklyHistory.length > 1 ? "3" : "2"}</div><div class="section-title">Top ${topDrivers.length} performers</div></div>
        <table>${renderTableHead(true)}<tbody>${topDrivers.map((d) => renderDriverRow(d, true)).join("")}</tbody></table>
      </div>

      <div class="section">
        <div class="section-head"><div class="section-eyebrow">Exhibit ${data.weeklyHistory && data.weeklyHistory.length > 1 ? "4" : "3"}</div><div class="section-title">Livreurs à coacher</div></div>
        <table>${renderTableHead(true)}<tbody>${bottomDrivers.map((d) => renderDriverRow(d, true)).join("")}</tbody></table>
      </div>

      ${data.aiRecommendations ? `<div class="ai-box"><div class="ai-label">✦ Recommandations</div><div class="ai-text">${data.aiRecommendations}</div></div>` : ""}
      ${driverRecos.length > 0 ? renderDriverRecommendations(driverRecos, (n) => n) : ""}
    </div>
    ${renderFooter(1, totalPages, data.generatedAt)}
  </div>`;

  // PAGES 2+: Full driver table (if allDrivers provided)
  let fullTablePages = "";
  if (hasAllDrivers) {
    const driversPerPage = 30;
    const pages = Math.ceil(allDrivers.length / driversPerPage);
    for (let p = 0; p < pages; p++) {
      const pageDrivers = allDrivers.slice(p * driversPerPage, (p + 1) * driversPerPage);
      const pageNum = p + 2;
      fullTablePages += `<div class="page">
        ${renderPageHead()}
        <div class="body" style="padding-top:20px;">
          <div class="section">
            <div class="section-head">
              <div class="section-eyebrow">Annexe ${p + 1}</div>
              <div class="section-title">Tableau complet des livreurs${pages > 1 ? ` (${p * driversPerPage + 1}–${Math.min((p + 1) * driversPerPage, allDrivers.length)} sur ${allDrivers.length})` : ""}</div>
            </div>
            <table>${renderTableHead(true)}<tbody>${pageDrivers.map((d) => renderDriverRow(d, true)).join("")}</tbody></table>
          </div>
        </div>
        ${renderFooter(pageNum, totalPages, data.generatedAt)}
      </div>`;
    }
  }

  const lexiquePage = renderLexiquePage(totalPages, totalPages, data.generatedAt);

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>DSPilot - Rapport S${data.week} ${data.year}</title><style>${CSS}</style></head><body>${page1}${fullTablePages}${lexiquePage}</body></html>`;
}
