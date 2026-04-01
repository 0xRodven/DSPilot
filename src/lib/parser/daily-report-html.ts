import { parseLocalizedAmazonNumber } from "./html-table";

export type DailyReportStat = {
  transporterId: string;
  rtsCount: number;
  dnrCount: number;
  podFails: number;
  ccFails: number;
};

export type ParseDailyReportHtmlResult = {
  date: string; // "2026-03-29"
  stats: DailyReportStat[];
  errors: string[];
  warnings: string[];
};

const AMAZON_ID_RE = /\b[A-Z0-9]{10,}\b/;
const FILENAME_DATE_RE = /Daily-Report[_-](\d{4}-\d{2}-\d{2})/i;

/** Extract YYYY-MM-DD from the report filename embedded in the HTML <title> or first heading. */
function extractDateFromHtml(html: string, filenameHint?: string): string {
  // Try filename hint first
  if (filenameHint) {
    const m = FILENAME_DATE_RE.exec(filenameHint);
    if (m) return m[1];
  }

  // Try <title> tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const m = FILENAME_DATE_RE.exec(titleMatch[1]);
    if (m) return m[1];
  }

  // Try any h1/h2 heading
  const headMatch = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (headMatch) {
    const m = FILENAME_DATE_RE.exec(headMatch[1]);
    if (m) return m[1];
  }

  return "";
}

function parseNum(raw: string): number {
  if (!raw || raw.trim() === "" || raw.trim().toLowerCase() === "none" || raw.trim() === "-") {
    return 0;
  }
  const n = parseLocalizedAmazonNumber(raw.trim());
  return n == null || Number.isNaN(n) ? 0 : n;
}

/**
 * Parse the Amazon Daily Report HTML.
 *
 * Table 1 (the summary table) has columns:
 *   Transporter ID | RTS | DNR | POD Fails | CC Fails
 *
 * The function is tolerant of missing columns and "None"/"-" values.
 */
export function parseDailyReportHtml(html: string, options: { filename?: string } = {}): ParseDailyReportHtmlResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: DailyReportStat[] = [];

  const date = extractDateFromHtml(html, options.filename ?? "");
  if (!date) {
    warnings.push("Impossible d'extraire la date du Daily Report");
  }

  // Find the first <table> (the summary per-transporter table)
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) {
    errors.push("Aucune table trouvée dans le Daily Report HTML");
    return { date, stats, errors, warnings };
  }

  const tableHtml = tableMatch[0];

  // Extract header row to find column indices
  const headerRowMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
  if (!headerRowMatch) {
    errors.push("Aucune ligne d'en-tête trouvée dans le Daily Report");
    return { date, stats, errors, warnings };
  }

  const headerCells = [...headerRowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
    m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );

  const colIndex = {
    transporterId: headerCells.findIndex((h) => h.includes("transporter") || h.includes("id")),
    rts: headerCells.findIndex((h) => h === "rts" || h.includes("return to station")),
    dnr: headerCells.findIndex((h) => h === "dnr" || h.includes("did not receive")),
    podFails: headerCells.findIndex((h) => h.includes("pod") || h.includes("proof")),
    ccFails: headerCells.findIndex((h) => h.includes("cc") || h.includes("contact")),
  };

  if (colIndex.transporterId === -1) {
    errors.push("Colonne Transporter ID introuvable dans le Daily Report");
    return { date, stats, errors, warnings };
  }

  if (colIndex.rts === -1) warnings.push("Colonne RTS introuvable dans le Daily Report");
  if (colIndex.dnr === -1) warnings.push("Colonne DNR introuvable dans le Daily Report");
  if (colIndex.podFails === -1) warnings.push("Colonne POD Fails introuvable dans le Daily Report");
  if (colIndex.ccFails === -1) warnings.push("Colonne CC Fails introuvable dans le Daily Report");

  // Parse data rows (skip header)
  const allRows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const rowMatch of allRows.slice(1)) {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
      m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );

    if (cells.length === 0) continue;

    const rawId = cells[colIndex.transporterId] ?? "";
    const idMatch = AMAZON_ID_RE.exec(rawId);
    if (!idMatch) continue;
    const transporterId = idMatch[0];

    stats.push({
      transporterId,
      rtsCount: colIndex.rts !== -1 ? parseNum(cells[colIndex.rts] ?? "") : 0,
      dnrCount: colIndex.dnr !== -1 ? parseNum(cells[colIndex.dnr] ?? "") : 0,
      podFails: colIndex.podFails !== -1 ? parseNum(cells[colIndex.podFails] ?? "") : 0,
      ccFails: colIndex.ccFails !== -1 ? parseNum(cells[colIndex.ccFails] ?? "") : 0,
    });
  }

  if (stats.length === 0) {
    warnings.push("Aucune ligne de données trouvée dans le Daily Report");
  }

  return { date, stats, errors, warnings };
}
