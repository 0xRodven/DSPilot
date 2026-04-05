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

interface ContactMissDetail {
  mailSlot: number;
  receptionist: number;
  safeLocation: number;
  doorstep: number;
  shed: number;
  other: number;
}

interface PhotoDefectDetail {
  householdMember: number;
  safeLocation: number;
  receptionist: number;
  mailSlot: number;
  other: number;
}

interface IadcBreakdownDetail {
  mailbox: number;
  unattended: number;
  safePlace: number;
  attended?: number;
  other: number;
}

interface DnrAddress {
  street: string;
  building?: string;
  floor?: string;
  postalCode: string;
  city: string;
}

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
      concessions?: number;
      contactMiss?: number;
      contactMissDetail?: ContactMissDetail | null;
      photoDefect?: number;
      photoDefectDetail?: PhotoDefectDetail | null;
      iadcBreakdown?: IadcBreakdownDetail | null;
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
      deliveryDatetime?: string;
      concessionDatetime?: string;
      address?: DnrAddress;
      gpsPlanned?: { lat: number; lng: number } | null;
      gpsActual?: { lat: number; lng: number } | null;
      gpsDistanceMeters?: number | null;
      deliveryType?: string | null;
      customerNotes?: string | null;
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
  "0": "Dim",
  "1": "Lun",
  "2": "Mar",
  "3": "Mer",
  "4": "Jeu",
  "5": "Ven",
  "6": "Sam",
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
  DELIVERED_TO_SAFE_PLACE: "Lieu sur",
  DELIVERED_TO_RECEPTIONIST: "Gardien",
  DELIVERED_TO_CONCIERGE: "Concierge",
  UNKNOWN: "—",
};

function formatDelay(deliveryDt: string, concessionDt: string): string {
  try {
    const d1 = new Date(deliveryDt.replace(" ", "T"));
    const d2 = new Date(concessionDt.replace(" ", "T"));
    const diffMs = d2.getTime() - d1.getTime();
    if (diffMs <= 0) return "—";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  } catch {
    return "—";
  }
}

function sub(val: number | undefined): string {
  if (!val) return '<span style="color:#a1a1a6">·</span>';
  return `${val}`;
}

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
thead th { font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6e6e73; padding: 5px 4px; border-bottom: 1.5px solid #1d1d1f; text-align: left; }
thead th.right { text-align: right; }
thead th.center { text-align: center; }
thead th.sub { font-size: 7px; font-weight: 400; color: #a1a1a6; border-bottom: 1px solid #d2d2d7; text-transform: none; letter-spacing: 0; }
thead th.group-left { border-left: 1px solid #d2d2d7; }
tbody td { padding: 5px 4px; border-bottom: 1px solid #f2f2f7; vertical-align: middle; }
tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
tbody td.mono { font-family: "SF Mono", monospace; font-size: 8px; color: #6e6e73; }
tbody td.group-left { border-left: 1px solid #e8e8ed; }
tbody tr:last-child td { border-bottom: none; }
tbody tr.totals { border-top: 2px solid #1d1d1f; background: #f9f9fb; font-weight: 600; }
tbody td.sub-val { font-size: 8px; color: #a1a1a6; }

/* History chart */
.history { display: flex; align-items: flex-end; gap: 8px; height: 60px; margin-bottom: 4px; }
.history-bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 4px; position: relative; }
.history-val { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: 600; color: #1d1d1f; }
.history-label { display: flex; justify-content: space-around; font-size: 8px; color: #6e6e73; }

/* DNR box */
.dnr-box { background: #fef2f2; border-left: 3px solid #ef4444; padding: 12px 16px; margin-bottom: 16px; }
.dnr-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #dc2626; margin-bottom: 6px; }

/* DNR detail cards */
.dnr-card { background: #fff; border: 1px solid #fde8e8; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
.dnr-card:last-child { margin-bottom: 0; }
.dnr-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.dnr-tracking { font-family: "SF Mono", monospace; font-size: 9px; font-weight: 600; color: #1d1d1f; }
.dnr-delay { font-size: 9px; color: #dc2626; font-weight: 500; }
.dnr-content { display: flex; gap: 14px; }
.dnr-info { flex: 1; }
.dnr-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 9px; }
.dnr-field-label { color: #6e6e73; }
.dnr-field-value { color: #1d1d1f; font-weight: 500; }
.dnr-notes { background: #fef9f0; border: 1px solid #fde68a; border-radius: 4px; padding: 4px 8px; margin-top: 6px; font-size: 8px; color: #92400e; font-style: italic; }
.dnr-map { width: 160px; height: 100px; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid #e8e8ed; }
.dnr-map img { width: 100%; height: 100%; object-fit: cover; }
.dnr-map-link { display: block; text-align: center; font-size: 7px; color: #2563eb; margin-top: 2px; }
.inv-badge { display: inline-block; background: #8b5cf6; color: white; font-size: 7px; padding: 1px 5px; border-radius: 3px; font-weight: 600; margin-left: 4px; }

/* IADC detail */
.iadc-grid { display: flex; gap: 8px; margin-top: 8px; }
.iadc-item { flex: 1; background: #f9fafb; border-radius: 6px; padding: 8px 10px; text-align: center; }
.iadc-count { font-size: 16px; font-weight: 700; }
.iadc-name { font-size: 7px; text-transform: uppercase; letter-spacing: 0.03em; color: #6e6e73; margin-top: 2px; }

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

  // Daily performance table with sub-columns
  const dailyRows = d.dailyPerformance
    .map((day) => {
      const dnr = d.dnrByDay[day.date] ?? 0;
      const cm = day.contactMissDetail;
      const pd = day.photoDefectDetail;
      const cmTotal = day.contactMiss ?? 0;
      const pdTotal = day.photoDefect ?? 0;
      return `<tr>
        <td>${getDayLabel(day.date)}</td>
        <td class="right">${day.deliveries}</td>
        <td class="right">${(day.concessions ?? 0) > 0 ? `<span style="color:#dc2626;font-weight:600">${day.concessions}</span>` : '<span style="color:#a1a1a6">0</span>'}</td>
        <td class="right" style="font-weight:600;color:${getDwcColor(day.dwcPercent)}">${formatPercent(day.dwcPercent)}</td>
        <td class="right group-left" style="${cmTotal > 0 ? "font-weight:600;color:#dc2626" : "color:#a1a1a6"}">${cmTotal}</td>
        <td class="right sub-val">${sub(cm?.mailSlot)}</td>
        <td class="right sub-val">${sub(cm?.receptionist)}</td>
        <td class="right sub-val">${sub(cm?.safeLocation)}</td>
        <td class="right sub-val">${sub(cm?.doorstep)}</td>
        <td class="right group-left" style="${pdTotal > 0 ? "font-weight:600;color:#f59e0b" : "color:#a1a1a6"}">${pdTotal}</td>
        <td class="right sub-val">${sub(pd?.householdMember)}</td>
        <td class="right sub-val">${sub(pd?.safeLocation)}</td>
        <td class="right sub-val">${sub(pd?.receptionist)}</td>
        <td class="right group-left">${formatPercent(day.iadcPercent)}</td>
        <td class="right">${dnr > 0 ? `<span style="color:#dc2626;font-weight:600">${dnr}</span>` : '<span style="color:#a1a1a6">—</span>'}</td>
      </tr>`;
    })
    .join("");

  // Totals for daily table
  const totals = d.dailyPerformance.reduce(
    (acc, day) => {
      acc.deliveries += day.deliveries;
      acc.concessions += day.concessions ?? 0;
      acc.contactMiss += day.contactMiss ?? 0;
      acc.cmMailSlot += day.contactMissDetail?.mailSlot ?? 0;
      acc.cmReceptionist += day.contactMissDetail?.receptionist ?? 0;
      acc.cmSafeLocation += day.contactMissDetail?.safeLocation ?? 0;
      acc.cmDoorstep += day.contactMissDetail?.doorstep ?? 0;
      acc.photoDefect += day.photoDefect ?? 0;
      acc.pdHouseholdMember += day.photoDefectDetail?.householdMember ?? 0;
      acc.pdSafeLocation += day.photoDefectDetail?.safeLocation ?? 0;
      acc.pdReceptionist += day.photoDefectDetail?.receptionist ?? 0;
      return acc;
    },
    {
      deliveries: 0,
      concessions: 0,
      contactMiss: 0,
      cmMailSlot: 0,
      cmReceptionist: 0,
      cmSafeLocation: 0,
      cmDoorstep: 0,
      photoDefect: 0,
      pdHouseholdMember: 0,
      pdSafeLocation: 0,
      pdReceptionist: 0,
    },
  );

  const totalsRow = `<tr class="totals">
    <td>Total</td>
    <td class="right">${totals.deliveries}</td>
    <td class="right" style="${totals.concessions > 0 ? "color:#dc2626" : "color:#a1a1a6"}">${totals.concessions}</td>
    <td class="right" style="color:${getDwcColor(d.dwcPercent)}">${formatPercent(d.dwcPercent)}</td>
    <td class="right group-left" style="${totals.contactMiss > 0 ? "color:#dc2626" : "color:#a1a1a6"}">${totals.contactMiss}</td>
    <td class="right sub-val">${sub(totals.cmMailSlot)}</td>
    <td class="right sub-val">${sub(totals.cmReceptionist)}</td>
    <td class="right sub-val">${sub(totals.cmSafeLocation)}</td>
    <td class="right sub-val">${sub(totals.cmDoorstep)}</td>
    <td class="right group-left" style="${totals.photoDefect > 0 ? "color:#f59e0b" : "color:#a1a1a6"}">${totals.photoDefect}</td>
    <td class="right sub-val">${sub(totals.pdHouseholdMember)}</td>
    <td class="right sub-val">${sub(totals.pdSafeLocation)}</td>
    <td class="right sub-val">${sub(totals.pdReceptionist)}</td>
    <td class="right group-left">${formatPercent(d.iadcPercent)}</td>
    <td class="right" style="color:#a1a1a6">—</td>
  </tr>`;

  // DNR detail cards
  const dnrHtml =
    d.dnrEntries.length > 0
      ? d.dnrEntries
          .map((e) => {
            const scan = scanLabels[e.scanType] ?? e.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ");
            const invBadge =
              e.entryType === "investigation" || e.status === "under_investigation"
                ? '<span class="inv-badge">INV</span>'
                : "";
            const delay =
              e.deliveryDatetime && e.concessionDatetime ? formatDelay(e.deliveryDatetime, e.concessionDatetime) : "—";
            const addr = e.address
              ? `${escapeHtml(e.address.street)}, ${escapeHtml(e.address.postalCode)} ${escapeHtml(e.address.city)}`
              : "—";
            const dist = e.gpsDistanceMeters != null ? `${e.gpsDistanceMeters}m` : "—";

            // Leaflet inline map
            const gps = e.gpsActual ?? e.gpsPlanned;
            const mapId = `map-${e.trackingId.replace(/[^a-zA-Z0-9]/g, "")}`;
            const mapHtml = gps
              ? `<div class="dnr-map">
                  <div id="${mapId}" style="width:100%;height:100%"></div>
                  <a class="dnr-map-link" href="https://www.google.com/maps?q=${gps.lat},${gps.lng}" target="_blank">Ouvrir Google Maps</a>
                </div>
                <script>
                  (function(){
                    var m=L.map('${mapId}',{zoomControl:false,attributionControl:false}).setView([${gps.lat},${gps.lng}],16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
                    L.circleMarker([${gps.lat},${gps.lng}],{radius:6,color:'#dc2626',fillColor:'#dc2626',fillOpacity:1}).addTo(m);
                    ${e.gpsPlanned && e.gpsActual ? `L.circleMarker([${e.gpsPlanned.lat},${e.gpsPlanned.lng}],{radius:5,color:'#2563eb',fillColor:'#2563eb',fillOpacity:0.7}).addTo(m);` : ""}
                  })();
                </script>`
              : "";

            const notesHtml = e.customerNotes ? `<div class="dnr-notes">${escapeHtml(e.customerNotes)}</div>` : "";

            return `<div class="dnr-card">
              <div class="dnr-card-header">
                <span class="dnr-tracking">${escapeHtml(e.trackingId)}${invBadge}</span>
                <span class="dnr-delay">${delay}</span>
              </div>
              <div class="dnr-content">
                <div class="dnr-info">
                  <div class="dnr-grid">
                    <span class="dnr-field-label">Livraison</span><span class="dnr-field-value">${e.deliveryDatetime ? escapeHtml(e.deliveryDatetime) : "—"}</span>
                    <span class="dnr-field-label">Concession</span><span class="dnr-field-value">${e.concessionDatetime ? escapeHtml(e.concessionDatetime) : "—"}</span>
                    <span class="dnr-field-label">Mode</span><span class="dnr-field-value">${escapeHtml(scan)}</span>
                    <span class="dnr-field-label">Distance</span><span class="dnr-field-value">${dist}</span>
                    <span class="dnr-field-label">Adresse</span><span class="dnr-field-value">${addr}</span>
                  </div>
                  ${notesHtml}
                </div>
                ${mapHtml}
              </div>
            </div>`;
          })
          .join("")
      : '<div style="font-size:10px;color:#059669;font-weight:500">Aucun DNR cette semaine</div>';

  // IADC detail section — aggregate from daily
  const iadcTotals = d.dailyPerformance.reduce(
    (acc, day) => {
      if (day.iadcBreakdown) {
        acc.mailbox += day.iadcBreakdown.mailbox;
        acc.unattended += day.iadcBreakdown.unattended;
        acc.safePlace += day.iadcBreakdown.safePlace;
        acc.attended += day.iadcBreakdown.attended ?? 0;
      }
      return acc;
    },
    { mailbox: 0, unattended: 0, safePlace: 0, attended: 0 },
  );
  const hasIadcDetail = iadcTotals.mailbox + iadcTotals.unattended + iadcTotals.safePlace + iadcTotals.attended > 0;

  const page = `
  <div class="page">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-brand">DSPilot</div>
        <div class="hero-meta">${escapeHtml(data.stationCode)}<br>${data.generatedAt}</div>
      </div>
      <div class="hero-title">${escapeHtml(d.name)}</div>
      <div class="hero-subtitle">Rapport individuel — Semaine ${data.week} / ${data.year}</div>
      <div class="hero-rank">${d.rank}${d.rank === 1 ? "er" : "e"} / ${d.totalDrivers} livreurs</div>
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
          ${d.investigationCount > 0 ? `<div class="kpi-delta down">${d.investigationCount} enquete(s)</div>` : ""}
        </div>
      </div>

      ${data.aiSummary ? `<div class="ai-box"><div class="ai-label">Analyse personnalisee</div><div class="ai-text">${data.aiSummary}</div></div>` : ""}

      ${
        d.history.length > 1
          ? `
      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Tendance</div>
          <div class="section-title">Evolution DWC sur ${d.history.length} semaines</div>
        </div>
        <div class="history">${historyBars}</div>
        <div class="history-label">${historyLabels}</div>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">Detail</div>
          <div class="section-title">Performance par jour</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align:bottom">Jour</th>
              <th class="right" rowspan="2" style="vertical-align:bottom">Colis</th>
              <th class="right" rowspan="2" style="vertical-align:bottom">Conc.</th>
              <th class="right" rowspan="2" style="vertical-align:bottom">DWC %</th>
              <th class="center group-left" colspan="5">Contact Miss</th>
              <th class="center group-left" colspan="4">Photo Defect</th>
              <th class="right group-left" rowspan="2" style="vertical-align:bottom">IADC %</th>
              <th class="right" rowspan="2" style="vertical-align:bottom">DNR</th>
            </tr>
            <tr>
              <th class="right sub group-left">Tot</th>
              <th class="right sub">BAL</th>
              <th class="right sub">Rec</th>
              <th class="right sub">LS</th>
              <th class="right sub">Door</th>
              <th class="right sub group-left">Tot</th>
              <th class="right sub">HM</th>
              <th class="right sub">LS</th>
              <th class="right sub">Rec</th>
            </tr>
          </thead>
          <tbody>${dailyRows}${totalsRow}</tbody>
        </table>
        <div style="font-size:7px;color:#a1a1a6;margin-top:4px">BAL = Boite aux lettres · Rec = Receptionniste · LS = Safe Location · Door = Doorstep · HM = Household Member (main propre)</div>
      </div>

      ${
        d.dnrCount > 0 || d.investigationCount > 0
          ? `
      <div class="dnr-box">
        <div class="dnr-label">DNR — ${d.dnrCount} concession${d.dnrCount > 1 ? "s" : ""}${d.investigationCount > 0 ? ` · ${d.investigationCount} investigation${d.investigationCount > 1 ? "s" : ""}` : ""}</div>
        ${dnrHtml}
      </div>
      `
          : ""
      }

      ${
        hasIadcDetail
          ? `
      <div class="section">
        <div class="section-head">
          <div class="section-eyebrow">IADC</div>
          <div class="section-title">Detail non-conformites IADC</div>
        </div>
        <div class="iadc-grid">
          <div class="iadc-item">
            <div class="iadc-count" style="color:${iadcTotals.mailbox > 0 ? "#dc2626" : "#059669"}">${iadcTotals.mailbox}</div>
            <div class="iadc-name">Mailbox Rec.</div>
          </div>
          <div class="iadc-item">
            <div class="iadc-count" style="color:${iadcTotals.unattended > 0 ? "#dc2626" : "#059669"}">${iadcTotals.unattended}</div>
            <div class="iadc-name">Unattended</div>
          </div>
          <div class="iadc-item">
            <div class="iadc-count" style="color:${iadcTotals.safePlace > 0 ? "#f59e0b" : "#059669"}">${iadcTotals.safePlace}</div>
            <div class="iadc-name">Safe Place</div>
          </div>
          <div class="iadc-item">
            <div class="iadc-count" style="color:${iadcTotals.attended > 0 ? "#f59e0b" : "#059669"}">${iadcTotals.attended}</div>
            <div class="iadc-name">Attended</div>
          </div>
        </div>
      </div>
      `
          : ""
      }

      <div class="lexique">
        <div class="entry"><dt>DWC</dt><dd>— Delivered With Customer. Pourcentage de colis livres conformement aux exigences Amazon.</dd></div>
        <div class="entry"><dt>IADC</dt><dd>— In Absence Delivery Compliance. Conformite des livraisons en absence du destinataire.</dd></div>
        <div class="entry"><dt>DNR</dt><dd>— Did Not Receive. Reclamation client signalant un colis non recu malgre la livraison enregistree.</dd></div>
        <div class="entry"><dt>Contact Miss</dt><dd>— Erreur de contact : colis depose sans verification du destinataire (BAL, gardien, lieu sur, etc.).</dd></div>
        <div class="entry"><dt>Photo Defect</dt><dd>— Photo de preuve non conforme (main propre, gardien, BAL, lieu sur).</dd></div>
        <div class="entry"><dt>Concession</dt><dd>— Remboursement accorde au client suite a un DNR. Impact direct sur le score DWC.</dd></div>
      </div>

    </div>
    <div class="footer">
      <span>DSPilot — Rapport individuel ${escapeHtml(d.name)} — S${data.week}/${data.year}</span>
      <span>Genere le ${data.generatedAt}</span>
    </div>
  </div>`;

  const leafletCdn = d.dnrEntries.some((e) => e.gpsActual || e.gpsPlanned)
    ? `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>`
    : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>DSPilot — ${escapeHtml(d.name)} — S${data.week}</title>${leafletCdn}<style>${CSS}</style></head><body>${page}</body></html>`;
}
