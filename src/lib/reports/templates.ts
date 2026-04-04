export type ReportDriverSummary = {
  name: string;
  dwcPercent: number;
  iadcPercent: number;
  deliveryMissesRisk: number;
  photoDefects: number;
  tier: string;
  trend?: number | null;
};

export type ReportAlertSummary = {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  targetPath?: string;
};

export type ReportDocument = {
  type: "daily" | "weekly";
  stationCode: string;
  stationName: string;
  periodLabel: string;
  generatedAtLabel: string;
  summary: string;
  headline: string;
  dataFreshness: string;
  confidenceLabel: string;
  kpis: Array<{ label: string; value: string; note?: string }>;
  highlights: string[];
  priorities: string[];
  topDrivers: ReportDriverSummary[];
  riskDrivers: ReportDriverSummary[];
  alerts: ReportAlertSummary[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDriverRows(drivers: ReportDriverSummary[]) {
  if (drivers.length === 0) {
    return `<tr><td colspan="6" class="empty">Aucune donnée pertinente</td></tr>`;
  }

  return drivers
    .map((driver) => {
      const trend =
        driver.trend === null || driver.trend === undefined
          ? "—"
          : `${driver.trend > 0 ? "+" : ""}${driver.trend.toFixed(1)} pts`;

      return `<tr>
        <td>${escapeHtml(driver.name)}</td>
        <td>${driver.dwcPercent.toFixed(1)}%</td>
        <td>${driver.iadcPercent.toFixed(1)}%</td>
        <td>${driver.deliveryMissesRisk}</td>
        <td>${driver.photoDefects}</td>
        <td>${escapeHtml(driver.tier)} · ${escapeHtml(trend)}</td>
      </tr>`;
    })
    .join("");
}

function renderAlertCards(alerts: ReportAlertSummary[]) {
  if (alerts.length === 0) {
    return `<div class="empty-card">Aucune alerte qualifiée sur cette période.</div>`;
  }

  return alerts
    .map(
      (alert) => `<article class="alert-card alert-${alert.severity}">
        <div class="alert-header">
          <span class="pill">${escapeHtml(alert.severity.toUpperCase())}</span>
          <h4>${escapeHtml(alert.title)}</h4>
        </div>
        <p>${escapeHtml(alert.summary)}</p>
        ${alert.targetPath ? `<p class="target">DSPilot: ${escapeHtml(alert.targetPath)}</p>` : ""}
      </article>`,
    )
    .join("");
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return `<li>Aucun point saillant.</li>`;
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

export function renderReportAscii(report: ReportDocument) {
  const topDrivers = report.topDrivers
    .slice(0, 5)
    .map(
      (driver, index) =>
        `${index + 1}. ${driver.name} | DWC ${driver.dwcPercent.toFixed(1)}% | IADC ${driver.iadcPercent.toFixed(1)}% | Tier ${driver.tier}`,
    )
    .join("\n");

  const riskDrivers = report.riskDrivers
    .slice(0, 5)
    .map(
      (driver, index) =>
        `${index + 1}. ${driver.name} | DWC ${driver.dwcPercent.toFixed(1)}% | DNR ${driver.deliveryMissesRisk} | Photos ${driver.photoDefects}`,
    )
    .join("\n");

  return [
    `${report.type.toUpperCase()} REPORT | ${report.stationCode} | ${report.periodLabel}`,
    `Generated: ${report.generatedAtLabel}`,
    `Freshness: ${report.dataFreshness} | Confidence: ${report.confidenceLabel}`,
    "",
    `HEADLINE`,
    report.headline,
    "",
    `SUMMARY`,
    report.summary,
    "",
    `KPIS`,
    ...report.kpis.map((kpi) => `- ${kpi.label}: ${kpi.value}${kpi.note ? ` (${kpi.note})` : ""}`),
    "",
    `HIGHLIGHTS`,
    ...report.highlights.map((item) => `- ${item}`),
    "",
    `PRIORITIES`,
    ...report.priorities.map((item) => `- ${item}`),
    "",
    `TOP DRIVERS`,
    topDrivers || "Aucun",
    "",
    `RISK DRIVERS`,
    riskDrivers || "Aucun",
    "",
    `QUALIFIED ALERTS`,
    ...(report.alerts.length > 0
      ? report.alerts.map((alert) => `- [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.summary}`)
      : ["- Aucune alerte qualifiée"]),
  ].join("\n");
}

export function renderReportHtml(report: ReportDocument) {
  const kpis = report.kpis
    .map(
      (kpi) => `<div class="kpi">
        <div class="kpi-label">${escapeHtml(kpi.label)}</div>
        <div class="kpi-value">${escapeHtml(kpi.value)}</div>
        ${kpi.note ? `<div class="kpi-note">${escapeHtml(kpi.note)}</div>` : ""}
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(report.type.toUpperCase())} report - ${escapeHtml(report.stationCode)}</title>
    <style>
      :root {
        --bg: #f5f1e8;
        --paper: #fffdf8;
        --ink: #161616;
        --muted: #615e57;
        --line: rgba(22,22,22,.12);
        --accent: #14342b;
        --accent-soft: #e5efe8;
        --critical: #7d2b21;
        --warning: #9a6a10;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at top right, rgba(20,52,43,.08), transparent 40%), var(--bg);
        color: var(--ink);
        font-family: Georgia, "Times New Roman", serif;
      }
      .page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 40px 28px 56px;
      }
      .hero {
        background: linear-gradient(135deg, rgba(20,52,43,.96), rgba(10,26,22,.94));
        color: white;
        border-radius: 28px;
        padding: 28px 30px;
        box-shadow: 0 22px 60px rgba(0,0,0,.16);
      }
      .eyebrow {
        letter-spacing: .12em;
        text-transform: uppercase;
        font-size: 12px;
        opacity: .8;
      }
      .hero h1 {
        font-size: 40px;
        margin: 10px 0 8px;
        line-height: 1.05;
      }
      .hero p {
        max-width: 760px;
        margin: 0;
        font-size: 17px;
        line-height: 1.6;
        color: rgba(255,255,255,.9);
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .meta-card, .section, .table-card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 20px;
      }
      .meta-card {
        padding: 14px 16px;
      }
      .meta-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: var(--muted);
      }
      .meta-value {
        margin-top: 8px;
        font-size: 16px;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: 1.2fr .8fr;
        gap: 20px;
        margin-top: 22px;
      }
      .section {
        padding: 22px 24px;
      }
      .section h2 {
        margin: 0 0 14px;
        font-size: 22px;
      }
      .section ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 10px;
        line-height: 1.6;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }
      .kpi {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 16px;
      }
      .kpi-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .1em;
        color: var(--muted);
      }
      .kpi-value {
        font-size: 30px;
        margin-top: 12px;
        font-weight: 700;
      }
      .kpi-note {
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
      }
      .alert-grid {
        display: grid;
        gap: 12px;
      }
      .alert-card {
        border-radius: 16px;
        padding: 16px;
        border: 1px solid var(--line);
        background: white;
      }
      .alert-card h4 {
        margin: 0;
        font-size: 18px;
      }
      .alert-card p {
        margin: 8px 0 0;
        line-height: 1.55;
        color: var(--muted);
      }
      .alert-critical { border-left: 6px solid var(--critical); }
      .alert-warning { border-left: 6px solid var(--warning); }
      .alert-info { border-left: 6px solid var(--accent); }
      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 11px;
        letter-spacing: .12em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .table-card {
        margin-top: 20px;
        overflow: hidden;
      }
      .table-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        background: rgba(20,52,43,.04);
      }
      .table-head h3 {
        margin: 0;
        font-size: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 14px 24px;
        border-top: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }
      th {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: var(--muted);
      }
      .empty, .empty-card {
        color: var(--muted);
      }
      .empty-card {
        background: white;
        border-radius: 16px;
        border: 1px dashed var(--line);
        padding: 18px;
      }
      .target {
        font-family: "Courier New", monospace;
        font-size: 12px;
      }
      @media (max-width: 960px) {
        .meta, .grid, .kpi-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="eyebrow">DSPilot ${escapeHtml(report.type)} report</div>
        <h1>${escapeHtml(report.headline)}</h1>
        <p>${escapeHtml(report.summary)}</p>
        <div class="meta">
          <div class="meta-card">
            <div class="meta-label">Station</div>
            <div class="meta-value">${escapeHtml(report.stationName)} · ${escapeHtml(report.stationCode)}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Période</div>
            <div class="meta-value">${escapeHtml(report.periodLabel)}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Fraîcheur / confiance</div>
            <div class="meta-value">${escapeHtml(report.dataFreshness)} · ${escapeHtml(report.confidenceLabel)}</div>
          </div>
        </div>
      </section>

      <section class="kpi-grid">${kpis}</section>

      <section class="grid">
        <article class="section">
          <h2>Highlights</h2>
          <ul>${renderList(report.highlights)}</ul>
        </article>
        <article class="section">
          <h2>Priorités</h2>
          <ul>${renderList(report.priorities)}</ul>
        </article>
      </section>

      <section class="grid">
        <article class="section">
          <h2>Alertes qualifiées</h2>
          <div class="alert-grid">${renderAlertCards(report.alerts)}</div>
        </article>
        <article class="section">
          <h2>Traçabilité</h2>
          <ul>
            <li>Généré le ${escapeHtml(report.generatedAtLabel)}</li>
            <li>Fraîcheur data: ${escapeHtml(report.dataFreshness)}</li>
            <li>Confiance d'envoi: ${escapeHtml(report.confidenceLabel)}</li>
            <li>Les tiers drivers restent des segments DSPilot dérivés.</li>
          </ul>
        </article>
      </section>

      <section class="table-card">
        <div class="table-head">
          <h3>Drivers en amélioration</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>DWC</th>
              <th>IADC</th>
              <th>DNR</th>
              <th>Photos</th>
              <th>Tier / tendance</th>
            </tr>
          </thead>
          <tbody>${renderDriverRows(report.topDrivers)}</tbody>
        </table>
      </section>

      <section class="table-card">
        <div class="table-head">
          <h3>Drivers à risque</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>DWC</th>
              <th>IADC</th>
              <th>DNR</th>
              <th>Photos</th>
              <th>Tier / tendance</th>
            </tr>
          </thead>
          <tbody>${renderDriverRows(report.riskDrivers)}</tbody>
        </table>
      </section>
    </main>
  </body>
</html>`;
}
