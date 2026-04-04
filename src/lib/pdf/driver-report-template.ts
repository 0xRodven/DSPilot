/**
 * driver-report-template.ts
 *
 * HTML template generator for individual driver weekly reports.
 * Same design language as daily/weekly station reports.
 * Sent by email to each driver every week.
 */

import { getDwcColor } from "../utils/performance-color";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriverReportData {
  stationName: string;
  stationCode: string;
  week: number;
  year: number;
  generatedAt: string;
  driver: {
    name: string;
    rank: number;
    totalDrivers: number;
    dwcPercent: number;
    iadcPercent: number;
    dwcChange?: number;
    totalDeliveries: number;
    daysWorked: number;
    history: Array<{ week: number; year: number; dwcPercent: number }>;
    dailyPerformance: Array<{
      date: string;
      dwcPercent: number;
      iadcPercent: number;
      deliveries: number;
      errors: number;
    }>;
    errorBreakdown: {
      contactMiss: number;
      photoDefect: number;
      rts: number;
    };
    dnrEntries: Array<{
      trackingId: string;
      date: string;
      scanType: string;
      status: string;
      entryType: string;
    }>;
    dnrByDay: Record<string, number>;
    dnrCount: number;
    investigationCount: number;
  };
  aiSummary?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChange(value?: number): string {
  if (value === undefined || value === null) return "";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

const DAYS_FR: Record<string, string> = {
  "0": "Dim", "1": "Lun", "2": "Mar", "3": "Mer", "4": "Jeu", "5": "Ven", "6": "Sam",
};

function getDayLabel(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const dayNum = d.getDay().toString();
    const dd = dateStr.slice(8, 10);
    const mm = dateStr.slice(5, 7);
    return `${DAYS_FR[dayNum]} ${dd}/${mm}`;
  } catch {
    return dateStr;
  }
}

const scanLabels: Record<string, string> = {
  DELIVERED_TO_HOUSEHOLD_MEMBER: "Remis tiers",
  DELIVERED_TO_MAIL_SLOT: "BAL",
  DELIVERED_TO_CUSTOMER: "Main propre",
  DELIVERED_TO_NEIGHBOUR: "Voisin",
  DELIVERED_TO_SAFE_PLACE: "Lieu sûr",
  DELIVERED_TO_RECEPTIONIST: "Gardien",
  DELIVERED_TO_CONCIERGE: "Concierge",
  UNKNOWN: "—",
};

// ---------------------------------------------------------------------------
// CSS (same design system as daily/weekly)
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
.hero-brand { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.hero-meta { text-align: right; font-size: 10px; opacity: 0.7; line-height: 1.5; }
.hero-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 12px 0 2px; }
.hero-subtitle { font-size: 11px; opacity: 0.75; }
.hero-rank { display: inline-block; background: rgba(255,255,255,0.2); padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 6px; }

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

/* AI Box */
.ai-box { background: #f0f4ff; border-left: 3px solid #2563eb; padding: 14px 18px; margin-bottom: 16px; }
.ai-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb; margin-bottom: 6px; }
.ai-text { font-size: 11px; line-height: 1.7; color: #1e3a5f; text-align: justify; }
.ai-text p { margin-bottom: 10px; }
.ai-text p:last-child { margin-bottom: 0; }
.ai-text strong { font-weight: 600; }

/* Sections */
.section { margin-bottom: 16px; }
.section-head { margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #1d1d1f; }
.section-eyebrow { font-size: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1a6; }
.section-title { font-size: 13px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em; line-height: 1.3; }

/* Table */
table { width: 100%; border-collapse: collapse; font-size: 9px; }
thead th { font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6e6e73; padding: 5px 6px; border-bottom: 1.5px solid #1d1d1f; text-align: left; }
thead th.right { text-align: right; }
tbody td { padding: 5px 6px; border-bottom: 1px solid #f2f2f7; vertical-align: middle; }
tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
tbody td.mono { font-family: "SF Mono", monospace; font-size: 8px; color: #6e6e73; }
tbody tr:last-child td { border-bottom: none; }

/* History chart */
.history { display: flex; align-items: flex-end; gap: 8px; height: 60px; margin-bottom: 4px; }
.history-bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 4px; position: relative; }
.history-val { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: 600; color: #1d1d1f; }
.history-label { display: flex; justify-content: space-around; font-size: 8px; color: #6e6e73; }

/* DNR box */
.dnr-box { background: #fef2f2; border-left: 3px solid #ef4444; padding: 12px 16px; margin-bottom: 16px; }
.dnr-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #dc2626; margin-bottom: 6px; }
.dnr-item { font-size: 10px; padding: 3px 0; border-bottom: 1px solid #fde8e8; }
.dnr-item:last-child { border-bottom: none; }
.dnr-tracking { font-family: "SF Mono", monospace; font-size: 9px; color: #6e6e73; }
.inv-badge { display: inline-block; background: #8b5cf6; color: white; font-size: 7px; padding: 1px 5px; border-radius: 3px; font-weight: 600; margin-left: 4px; }

/* Error breakdown */
.errors-grid { display: flex; gap: 12px; }
.error-item { flex: 1; background: #f9fafb; border-radius: 6px; padding: 10px 14px; text-align: center; }
.error-count { font-size: 20px; font-weight: 700; }
.error-name { font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6e6e73; margin-top: 2px; }

/* Lexique */
.lexique { font-size: 8px; color: #6e6e73; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e8e8ed; }
.lexique dt { font-weight: 600; color: #1d1d1f; display: inline; }
.lexique dd { display: inline; margin-left: 4px; }
.lexique .entry { margin-bottom: 3px; }

/* Footer */
.footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 36px; font-size: 8px; color: #a1a1a6; display: flex; justify-content: space-between; border-top: 1px solid #f2f2f7; }
`;

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function generateDriverReportHtml(data: DriverReportData): string {
  const d = data.driver;
  const changeClass = (d.dwcChange ?? 0) >= 0 ? "up" : "down";

  // History chart bars
  const maxDwc = Math.max(...d.history.map((h) => h.dwcPercent), 100);
  const minDwc = Math.min(...d.history.map((h) => h.dwcPercent), 80);
  const range = Math.max(maxDwc - minDwc, 10);

  const historyBars = d.history
    .map((h) => {
      const pct = ((h.dwcPercent - minDwc) / range) * 100;
      const color = getDwcColor(h.dwcPercent);
      return `<div class="history-bar" style="height:${Math.max(pct, 8)}%;background:${color}"><div class="history-val">${h.dwcPercent}%</div></div>`;
    })
    .join("");

  const historyLabels = d.history.map((h) => `<span>S${h.week}</span>`).join("");

  // Daily performance table
  const dailyRows = d.dailyPerformance
    .map((day) => {
      const dnr = d.dnrByDay[day.date] ?? 0;
      return `<tr>
        <td>${getDayLabel(day.date)}</td>
        <td class="right" style="font-weight:600;color:${getDwcColor(day.dwcPercent)}">${formatPercent(day.dwcPercent)}</td>
        <td class="right">${formatPercent(day.iadcPercent)}</td>
        <td class="right">${day.deliveries}</td>
        <td class="right">${day.errors}</td>
        <td class="right">${dnr > 0 ? `<span style="color:#dc2626;font-weight:600">${dnr}</span>` : "—"}</td>
      </tr>`;
    })
    .join("");

  // DNR entries
  const dnrHtml =
    d.dnrEntries.length > 0
      ? d.dnrEntries
          .map((e) => {
            const scan = scanLabels[e.scanType] ?? e.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ");
            const invBadge = e.entryType === "investigation" || e.status === "under_investigation" ? '<span class="inv-badge">INV</span>' : "";
            return `<div class="dnr-item"><span class="dnr-tracking">${escapeHtml(e.trackingId)}</span> — ${getDayLabel(e.date)} — ${escapeHtml(scan)}${invBadge}</div>`;
          })
          .join("")
      : '<div style="font-size:10px;color:#059669;font-weight:500">Aucun DNR cette semaine</div>';

  const page = `
  <div class="page">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-brand">DSPilot</div>
        <div class="hero-meta">${escapeHtml(data.stationCode)}<br>${data.generatedAt}</div>
      </div>
      <div class="hero-title">${escapeHtml(d.name)}</div>
      <div class="hero-subtitle">Rapport individuel — Semaine ${data.week} / ${data.year}</div>
      <div class="hero-rank">${d.rank}${d.rank === 1 ? "er" : "ème"} / ${d.totalDrivers} livreurs</div>
    </div>
    <div class="body">

      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">DWC</div>
          <div class="kpi-value" style="color:${getDwcColor(d.dwcPercent)}">${formatPercent(d.dwcPercent)}</div>
          ${d.dwcChange !== undefined ? `<div class="kpi-delta ${changeClass}">${formatChange(d.dwcChange)} vs S${data.week - 1}</div>` : ""}
        </div>
        <div class="kpi">
          <div class="kpi-label">IADC</div>
          <div class="kpi-value">${formatPercent(d.iadcPercent)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Colis</div>
          <div class="kpi-value">${d.totalDeliveries.toLocaleString("fr-FR")}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Jours</div>
          <div class="kpi-value">${d.daysWorked}/7</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">DNR</div>
          <div class="kpi-value" style="color:${d.dnrCount > 0 ? "#dc2626" : "#059669"}">${d.dnrCount}</div>
          ${d.investigationCount > 0 ? `<div class="kpi-delta down">${d.investigationCount} enquête(s)</div>` : ""}
        </div>
      </div>

      ${data.aiSummary ? `<div class="ai-box"><div class="ai-label">Analyse personnalisée</div><div class="ai-text">${data.aiSummary}</div></div>` : ""}

      ${d.history.length > 1 ? `
      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Tendance</div>
          <div class="section-title">Évolution DWC sur ${d.history.length} semaines</div>
        </div>
        <div class="history">${historyBars}</div>
        <div class="history-label">${historyLabels}</div>
      </div>
      ` : ""}

      ${d.dnrCount > 0 || d.investigationCount > 0 ? `
      <div class="dnr-box">
        <div class="dnr-label">DNR — ${d.dnrCount} concession${d.dnrCount > 1 ? "s" : ""}${d.investigationCount > 0 ? ` · ${d.investigationCount} investigation${d.investigationCount > 1 ? "s" : ""}` : ""}</div>
        ${dnrHtml}
      </div>
      ` : ""}

      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Détail</div>
          <div class="section-title">Performance par jour</div>
        </div>
        <table>
          <thead><tr>
            <th>Jour</th>
            <th class="right">DWC %</th>
            <th class="right">IADC %</th>
            <th class="right">Colis</th>
            <th class="right">Erreurs</th>
            <th class="right">DNR</th>
          </tr></thead>
          <tbody>${dailyRows}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Erreurs</div>
          <div class="section-title">Répartition des erreurs</div>
        </div>
        <div class="errors-grid">
          <div class="error-item">
            <div class="error-count" style="color:${d.errorBreakdown.contactMiss > 0 ? "#dc2626" : "#059669"}">${d.errorBreakdown.contactMiss}</div>
            <div class="error-name">Contact miss</div>
          </div>
          <div class="error-item">
            <div class="error-count" style="color:${d.errorBreakdown.photoDefect > 0 ? "#f59e0b" : "#059669"}">${d.errorBreakdown.photoDefect}</div>
            <div class="error-name">Photo</div>
          </div>
          <div class="error-item">
            <div class="error-count" style="color:${d.errorBreakdown.rts > 0 ? "#f59e0b" : "#059669"}">${d.errorBreakdown.rts}</div>
            <div class="error-name">RTS</div>
          </div>
        </div>
      </div>

      <div class="lexique">
        <div class="entry"><dt>DWC</dt><dd>— Delivered With Customer. Pourcentage de colis livrés conformément aux exigences Amazon.</dd></div>
        <div class="entry"><dt>IADC</dt><dd>— In Absence Delivery Compliance. Conformité des livraisons en absence du destinataire.</dd></div>
        <div class="entry"><dt>DNR</dt><dd>— Did Not Receive. Réclamation client signalant un colis non reçu malgré la livraison enregistrée.</dd></div>
        <div class="entry"><dt>Contact miss</dt><dd>— Erreur de contact lors de la livraison (mauvaise adresse, destinataire absent non géré).</dd></div>
        <div class="entry"><dt>RTS</dt><dd>— Return To Station. Colis retourné à la station sans livraison.</dd></div>
        <div class="entry"><dt>Investigation</dt><dd>— Enquête formelle Amazon suite à un DNR. Plus grave qu'une simple concession.</dd></div>
      </div>

    </div>
    <div class="footer">
      <span>DSPilot — Rapport individuel ${escapeHtml(d.name)} — S${data.week}/${data.year}</span>
      <span>Généré le ${data.generatedAt}</span>
    </div>
  </div>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>DSPilot — ${escapeHtml(d.name)} — S${data.week}</title><style>${CSS}</style></head><body>${page}</body></html>`;
}
