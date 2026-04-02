#!/usr/bin/env npx tsx

/**
 * render-report-pdf.ts
 *
 * CLI script to generate HTML reports from JSON data.
 * The HTML can then be rendered to PDF via:
 *   - Chrome headless: chrome --headless --print-to-pdf=output.pdf input.html
 *   - Browser: Open HTML and Cmd+P / Ctrl+P to print to PDF
 *   - Playwright/Puppeteer on VPS
 *
 * Usage:
 *   npx tsx scripts/render-report-pdf.ts --input data.json --output report.html [--blur-names]
 *
 * Example data.json structure: see ReportData interface in src/lib/pdf/report-template.ts
 */

import * as fs from "fs";
import * as path from "path";

// We need to handle the import dynamically since this is a standalone script
// that may be run outside the normal build context

interface ReportDriver {
  rank: number;
  name: string;
  dwcPercent: number;
  iadcPercent: number;
  daysWorked: number;
}

interface ReportData {
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
  aiSummary?: string;
  aiRecommendations?: string;
}

// ---------------------------------------------------------------------------
// Color helpers (inline to avoid import issues)
// ---------------------------------------------------------------------------

interface DwcColorStop {
  pct: number;
  hex: string;
}

const DWC_GRADIENT_STOPS: DwcColorStop[] = [
  { pct: 80, hex: "#ef4444" },
  { pct: 85, hex: "#f97316" },
  { pct: 88, hex: "#f59e0b" },
  { pct: 90, hex: "#60a5fa" },
  { pct: 92, hex: "#3b82f6" },
  { pct: 95, hex: "#10b981" },
  { pct: 97, hex: "#059669" },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getDwcColor(dwcPercent: number): string {
  const stops = DWC_GRADIENT_STOPS;

  if (dwcPercent <= stops[0].pct) return stops[0].hex;
  if (dwcPercent >= stops[stops.length - 1].pct) return stops[stops.length - 1].hex;

  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (dwcPercent >= lo.pct && dwcPercent <= hi.pct) {
      const t = (dwcPercent - lo.pct) / (hi.pct - lo.pct);
      const [r1, g1, b1] = hexToRgb(lo.hex);
      const [r2, g2, b2] = hexToRgb(hi.hex);
      return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
    }
  }

  return stops[stops.length - 1].hex;
}

// ---------------------------------------------------------------------------
// Template helpers (inline)
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
  return `${sign}${value.toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DISTRIBUTION_COLORS = {
  above95: "#10b981",
  pct90to95: "#3b82f6",
  pct85to90: "#f59e0b",
  pct80to85: "#f97316",
  below80: "#ef4444",
};

// ---------------------------------------------------------------------------
// Template generator (inline to avoid import issues)
// ---------------------------------------------------------------------------

function generateReportHtml(data: ReportData, options: { blurNames?: boolean } = {}): string {
  const { blurNames = false } = options;

  const topDrivers = blurNames ? data.topDrivers.map((d) => ({ ...d, name: blurName(d.name) })) : data.topDrivers;

  const bottomDrivers = blurNames
    ? data.bottomDrivers.map((d) => ({ ...d, name: blurName(d.name) }))
    : data.bottomDrivers;

  const dist = data.dwcDistribution;
  const distTotal = dist.above95 + dist.pct90to95 + dist.pct85to90 + dist.pct80to85 + dist.below80 || 1;

  const distPercents = {
    above95: (dist.above95 / distTotal) * 100,
    pct90to95: (dist.pct90to95 / distTotal) * 100,
    pct85to90: (dist.pct85to90 / distTotal) * 100,
    pct80to85: (dist.pct80to85 / distTotal) * 100,
    below80: (dist.below80 / distTotal) * 100,
  };

  const versionLabel = blurNames ? " | Version Livreurs" : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DSPilot - Rapport S${data.week} ${data.year} - ${data.stationCode}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background: #ffffff;
      position: relative;
    }

    @media print {
      .page {
        page-break-after: always;
      }
    }

    .hero {
      background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%);
      color: white;
      padding: 32px 40px 28px;
      position: relative;
    }

    .hero-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .hero-logo {
      width: 48px;
      height: 48px;
      filter: brightness(10);
    }

    .hero-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .hero-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }

    .hero-right {
      text-align: right;
    }

    .hero-station {
      font-size: 20px;
      font-weight: 600;
    }

    .hero-week {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }

    .content {
      padding: 32px 40px 80px;
    }

    .kpis {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 32px;
      padding: 20px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .kpi {
      text-align: center;
      padding: 0 32px;
      border-right: 1px solid #e2e8f0;
    }

    .kpi:last-child {
      border-right: none;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -1px;
    }

    .kpi-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .kpi-change {
      font-size: 10px;
      margin-top: 4px;
    }

    .kpi-change.positive {
      color: #10b981;
    }

    .kpi-change.negative {
      color: #ef4444;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-header {
      margin-bottom: 16px;
    }

    .section-eyebrow {
      font-size: 10px;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
    }

    .distribution-bar {
      display: flex;
      height: 24px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .distribution-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: 600;
      min-width: 0;
    }

    .distribution-legend {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: #64748b;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .legend-count {
      font-weight: 600;
      color: #0f172a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
    }

    th.numeric {
      text-align: right;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11px;
    }

    td.numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    td.rank {
      width: 40px;
      color: #94a3b8;
      font-weight: 500;
    }

    td.name {
      font-weight: 500;
      color: #0f172a;
    }

    td.dwc {
      font-weight: 600;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .ai-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 20px 24px;
      margin-top: 24px;
    }

    .ai-box-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .ai-icon {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: 700;
    }

    .ai-box-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }

    .ai-box-content {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }

    .ai-box-content p {
      margin-bottom: 8px;
    }

    .ai-box-content p:last-child {
      margin-bottom: 0;
    }

    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px 40px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
      background: #ffffff;
    }

    .footer-left {
      display: flex;
      gap: 16px;
    }

    .footer-center {
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #cbd5e1;
    }

    .footer-right {
      text-align: right;
    }

    .page-number {
      font-weight: 500;
    }

    .tables-row {
      display: flex;
      gap: 32px;
    }

    .tables-row .table-col {
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <div class="hero-content">
        <div class="hero-left">
          <img src="logo/DSPilot_Icon.png" alt="DSPilot" class="hero-logo" onerror="this.style.display='none'">
          <div>
            <div class="hero-title">DSPilot</div>
            <div class="hero-subtitle">Rapport de Performance Hebdomadaire${versionLabel}</div>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-station">${escapeHtml(data.stationName)} (${escapeHtml(data.stationCode)})</div>
          <div class="hero-week">Semaine ${data.week} | ${data.year}</div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-value">${formatPercent(data.kpis.avgDwc)}</div>
          <div class="kpi-label">Score DWC</div>
          ${
            data.kpis.dwcChange !== undefined
              ? `
          <div class="kpi-change ${data.kpis.dwcChange >= 0 ? "positive" : "negative"}">
            ${formatChange(data.kpis.dwcChange)} vs sem. prec.
          </div>
          `
              : ""
          }
        </div>
        <div class="kpi">
          <div class="kpi-value">${formatPercent(data.kpis.avgIadc)}</div>
          <div class="kpi-label">Score IADC</div>
          ${
            data.kpis.iadcChange !== undefined
              ? `
          <div class="kpi-change ${data.kpis.iadcChange >= 0 ? "positive" : "negative"}">
            ${formatChange(data.kpis.iadcChange)} vs sem. prec.
          </div>
          `
              : ""
          }
        </div>
        <div class="kpi">
          <div class="kpi-value">${data.kpis.activeDrivers}</div>
          <div class="kpi-label">Livreurs Actifs</div>
          <div class="kpi-change" style="color: #64748b;">sur ${data.kpis.totalDrivers} total</div>
        </div>
        ${
          data.kpis.totalDelivered !== undefined
            ? `
        <div class="kpi">
          <div class="kpi-value">${formatNumber(data.kpis.totalDelivered)}</div>
          <div class="kpi-label">Colis Livres</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-eyebrow">Exhibit 1</div>
          <div class="section-title">Distribution des Scores DWC</div>
        </div>
        <div class="distribution-bar">
          ${
            distPercents.above95 > 0
              ? `
          <div class="distribution-segment" style="width: ${distPercents.above95}%; background: ${DISTRIBUTION_COLORS.above95};">
            ${dist.above95 > 0 ? dist.above95 : ""}
          </div>
          `
              : ""
          }
          ${
            distPercents.pct90to95 > 0
              ? `
          <div class="distribution-segment" style="width: ${distPercents.pct90to95}%; background: ${DISTRIBUTION_COLORS.pct90to95};">
            ${dist.pct90to95 > 0 ? dist.pct90to95 : ""}
          </div>
          `
              : ""
          }
          ${
            distPercents.pct85to90 > 0
              ? `
          <div class="distribution-segment" style="width: ${distPercents.pct85to90}%; background: ${DISTRIBUTION_COLORS.pct85to90};">
            ${dist.pct85to90 > 0 ? dist.pct85to90 : ""}
          </div>
          `
              : ""
          }
          ${
            distPercents.pct80to85 > 0
              ? `
          <div class="distribution-segment" style="width: ${distPercents.pct80to85}%; background: ${DISTRIBUTION_COLORS.pct80to85};">
            ${dist.pct80to85 > 0 ? dist.pct80to85 : ""}
          </div>
          `
              : ""
          }
          ${
            distPercents.below80 > 0
              ? `
          <div class="distribution-segment" style="width: ${distPercents.below80}%; background: ${DISTRIBUTION_COLORS.below80};">
            ${dist.below80 > 0 ? dist.below80 : ""}
          </div>
          `
              : ""
          }
        </div>
        <div class="distribution-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: ${DISTRIBUTION_COLORS.above95};"></div>
            <span>&ge;95%</span>
            <span class="legend-count">${dist.above95}</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: ${DISTRIBUTION_COLORS.pct90to95};"></div>
            <span>90-95%</span>
            <span class="legend-count">${dist.pct90to95}</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: ${DISTRIBUTION_COLORS.pct85to90};"></div>
            <span>85-90%</span>
            <span class="legend-count">${dist.pct85to90}</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: ${DISTRIBUTION_COLORS.pct80to85};"></div>
            <span>80-85%</span>
            <span class="legend-count">${dist.pct80to85}</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: ${DISTRIBUTION_COLORS.below80};"></div>
            <span>&lt;80%</span>
            <span class="legend-count">${dist.below80}</span>
          </div>
        </div>
      </div>

      <div class="tables-row">
        <div class="table-col">
          <div class="section">
            <div class="section-header">
              <div class="section-eyebrow">Exhibit 2</div>
              <div class="section-title">Top Performers</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Livreur</th>
                  <th class="numeric">DWC %</th>
                  <th class="numeric">IADC %</th>
                  <th class="numeric">Jours</th>
                </tr>
              </thead>
              <tbody>
                ${topDrivers
                  .map(
                    (driver) => `
                <tr>
                  <td class="rank">${driver.rank}</td>
                  <td class="name">${escapeHtml(driver.name)}</td>
                  <td class="numeric dwc" style="color: ${getDwcColor(driver.dwcPercent)};">${formatPercent(driver.dwcPercent)}</td>
                  <td class="numeric" style="color: ${getDwcColor(driver.iadcPercent)};">${formatPercent(driver.iadcPercent)}</td>
                  <td class="numeric">${driver.daysWorked}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-col">
          <div class="section">
            <div class="section-header">
              <div class="section-eyebrow">Exhibit 3</div>
              <div class="section-title">Livreurs a Coacher</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Livreur</th>
                  <th class="numeric">DWC %</th>
                  <th class="numeric">IADC %</th>
                  <th class="numeric">Jours</th>
                </tr>
              </thead>
              <tbody>
                ${
                  bottomDrivers.length > 0
                    ? bottomDrivers
                        .map(
                          (driver) => `
                <tr>
                  <td class="rank">${driver.rank}</td>
                  <td class="name">${escapeHtml(driver.name)}</td>
                  <td class="numeric dwc" style="color: ${getDwcColor(driver.dwcPercent)};">${formatPercent(driver.dwcPercent)}</td>
                  <td class="numeric" style="color: ${getDwcColor(driver.iadcPercent)};">${formatPercent(driver.iadcPercent)}</td>
                  <td class="numeric">${driver.daysWorked}</td>
                </tr>
                `,
                        )
                        .join("")
                    : `
                <tr>
                  <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">
                    Aucun livreur en dessous de 85%
                  </td>
                </tr>
                `
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      ${
        data.aiSummary || data.aiRecommendations
          ? `
      <div class="section">
        <div class="section-header">
          <div class="section-eyebrow">Exhibit 4</div>
          <div class="section-title">Analyse IA</div>
        </div>
        <div class="ai-box">
          <div class="ai-box-header">
            <div class="ai-icon">AI</div>
            <div class="ai-box-title">Synthese et Recommandations</div>
          </div>
          <div class="ai-box-content">
            ${data.aiSummary ? `<p>${escapeHtml(data.aiSummary)}</p>` : ""}
            ${data.aiRecommendations ? `<p>${escapeHtml(data.aiRecommendations)}</p>` : ""}
          </div>
        </div>
      </div>
      `
          : ""
      }
    </div>

    <div class="footer">
      <div class="footer-left">
        <span>Genere le ${escapeHtml(data.generatedAt)}</span>
        <span>Source: Amazon Scorecard</span>
      </div>
      <div class="footer-center">Confidentiel</div>
      <div class="footer-right">
        <span>DSPilot | dspilot.fr</span>
        <span class="page-number"> | Page 1</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/render-report-pdf.ts [options]

Options:
  --input <file>     JSON file with report data (required)
  --output <file>    Output HTML file (required)
  --blur-names       Blur driver names for privacy
  --help             Show this help message

Example:
  npx tsx scripts/render-report-pdf.ts --input data.json --output report.html
  npx tsx scripts/render-report-pdf.ts --input data.json --output report.html --blur-names

The generated HTML can be converted to PDF via:
  - Chrome headless: google-chrome --headless --print-to-pdf=report.pdf report.html
  - Browser: Open HTML and use Cmd+P / Ctrl+P to print to PDF
  - Playwright on VPS: Use existing render-pdf.js script
`);
}

function parseArgs(args: string[]): { input?: string; output?: string; blurNames: boolean } {
  const result: { input?: string; output?: string; blurNames: boolean } = {
    blurNames: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--input" && args[i + 1]) {
      result.input = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      result.output = args[++i];
    } else if (arg === "--blur-names") {
      result.blurNames = true;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input || !args.output) {
    console.error("Error: --input and --output are required");
    printUsage();
    process.exit(1);
  }

  // Read input JSON
  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let data: ReportData;
  try {
    const jsonContent = fs.readFileSync(inputPath, "utf-8");
    data = JSON.parse(jsonContent) as ReportData;
  } catch (err) {
    console.error(`Error: Failed to parse JSON: ${err}`);
    process.exit(1);
  }

  // Generate HTML
  const html = generateReportHtml(data, { blurNames: args.blurNames });

  // Write output
  const outputPath = path.resolve(args.output);
  fs.writeFileSync(outputPath, html, "utf-8");

  console.log(`HTML report generated: ${outputPath}`);
  console.log(`
To convert to PDF:
  - Chrome: google-chrome --headless --print-to-pdf="${outputPath.replace(".html", ".pdf")}" "${outputPath}"
  - Browser: Open the HTML file and use Cmd+P / Ctrl+P to print to PDF
`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
