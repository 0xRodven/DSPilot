/**
 * Parser HTML pour l'Aperçu de livraison Amazon Partner Central.
 *
 * Structure attendue :
 *   <table>
 *     <tr><th>Métrique</th><th>Semaine 10</th><th>Semaine 11</th>...</tr>
 *     <tr><td>Colis livrés</td><td>24 436</td><td>13 123</td>...</tr>
 *     ...
 *   </table>
 *
 * Retourne le même shape que `parseDeliveryOverviewCsv` pour réutiliser le
 * pipeline d'ingest.
 */

import type { DeliveryMetricData, DetectedWeek, ParseDeliveryOverviewResult } from "./delivery-overview-csv";
import { extractFirstTable, stripHtml } from "./html-table";

const WHITESPACE_REGEX = /[\u00a0\u202f\s]+/g;

function parseNumericValue(raw: string): number | undefined {
  const cleaned = raw.replace(/[€$£%]/g, "").trim();
  if (!cleaned) return undefined;
  const noSpaces = cleaned.replace(WHITESPACE_REGEX, "");
  const normalized =
    noSpaces.includes(",") && !noSpaces.includes(".") ? noSpaces.replace(",", ".") : noSpaces.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function extractWeekNumber(header: string): number | null {
  const match = header.match(/(?:Semaine|Week|Sem\.?|S|W)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractYearFromFilename(filename: string | undefined): number | null {
  if (!filename) return null;
  const m = filename.match(/_(\d{4})\.html?$/i);
  return m ? parseInt(m[1], 10) : null;
}

function inferYear(weekNum: number, hintYear?: number | null): number {
  if (hintYear) return hintYear;
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  if (currentMonth <= 1 && weekNum >= 40) return currentYear - 1;
  if (currentMonth >= 10 && weekNum <= 4) return currentYear + 1;
  return currentYear;
}

export function parseDeliveryOverviewHtml(
  html: string,
  options: { filename?: string; yearHint?: number } = {},
): ParseDeliveryOverviewResult {
  const errors: string[] = [];
  const metrics: DeliveryMetricData[] = [];
  const detectedWeeks: DetectedWeek[] = [];

  const yearHint = options.yearHint ?? extractYearFromFilename(options.filename);

  const table = extractFirstTable(html, (tableHtml) => {
    const header = stripHtml(tableHtml).replace(WHITESPACE_REGEX, " ").toLowerCase();
    return header.includes("métrique") || header.includes("metrique") || header.includes("metric");
  });

  if (!table) {
    errors.push("Aucune table Delivery Overview trouvée");
    return { metrics, detectedWeeks, errors };
  }

  if (table.rows.length < 2) {
    errors.push("Table Delivery Overview vide");
    return { metrics, detectedWeeks, errors };
  }

  const headerCells = table.rows[0].cells;
  const weekColumns: { index: number; week: number; year: number; label: string }[] = [];

  for (let i = 1; i < headerCells.length; i++) {
    const label = headerCells[i].text.replace(WHITESPACE_REGEX, " ").trim();
    const weekNum = extractWeekNumber(label);
    if (weekNum !== null) {
      const year = inferYear(weekNum, yearHint);
      weekColumns.push({ index: i, week: weekNum, year, label });
      detectedWeeks.push({ year, week: weekNum, label });
    } else if (label) {
      errors.push(`En-tête de colonne non reconnu: "${label}"`);
    }
  }

  if (weekColumns.length === 0) {
    errors.push("Aucune colonne de semaine détectée");
    return { metrics, detectedWeeks, errors };
  }

  for (let r = 1; r < table.rows.length; r++) {
    const cells = table.rows[r].cells;
    if (cells.length === 0) continue;
    const metricName = cells[0].text.replace(WHITESPACE_REGEX, " ").trim();
    if (!metricName) continue;

    for (const col of weekColumns) {
      const cell = cells[col.index];
      if (!cell) continue;
      const raw = cell.text.replace(WHITESPACE_REGEX, " ").trim();
      if (!raw) continue;
      metrics.push({
        metricName,
        year: col.year,
        week: col.week,
        value: raw,
        numericValue: parseNumericValue(raw),
      });
    }
  }

  return { metrics, detectedWeeks, errors };
}
