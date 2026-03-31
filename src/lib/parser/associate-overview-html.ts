import { extractFirstTable, parseLocalizedAmazonNumber } from "./html-table";

export type AssociateWeeklyStat = {
  amazonId: string;
  name: string;
  packagesDelivered?: number;
  dnrCount?: number;
  dnrDpmo?: number;
  packagesShipped?: number;
  rtsCount?: number;
  rtsPercent?: number;
  rtsDpmo?: number;
};

export type ParseAssociateOverviewHtmlResult = {
  rows: AssociateWeeklyStat[];
  errors: string[];
  warnings: string[];
};

const AMAZON_ID_PATTERN = /\b[A-Z0-9]{10,}\b/;

function extractDriverIdentity(cellHtml: string, fallbackText: string) {
  const anchorMatch = cellHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
  const idMatch = cellHtml.match(AMAZON_ID_PATTERN);

  return {
    name: anchorMatch
      ? anchorMatch[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : fallbackText,
    amazonId: idMatch?.[0] || null,
  };
}

export function parseAssociateOverviewHtml(html: string): ParseAssociateOverviewHtmlResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const table = extractFirstTable(
    html,
    (tableHtml) =>
      tableHtml.includes("delivery-associate-weekly-table") ||
      tableHtml.includes("delivery-associate-daily-table") ||
      tableHtml.includes("Nom du livreur"),
  );

  if (!table || table.rows.length < 2) {
    errors.push("Tableau Associate Overview introuvable");
    return { rows: [], errors, warnings };
  }

  const rows: AssociateWeeklyStat[] = [];

  for (const row of table.rows.slice(1)) {
    const nameCell = row.cells.find((cell) => cell.attributes["data-testid"] === "da_name") || row.cells[0];
    if (!nameCell) {
      continue;
    }

    const identity = extractDriverIdentity(nameCell.html, nameCell.text);
    if (!identity.amazonId || !identity.name) {
      warnings.push(`Ligne ignoree: identite livreur incomplete (${nameCell.text})`);
      continue;
    }

    const valuesByTestId = new Map<string, string>();
    for (const cell of row.cells) {
      const testId = cell.attributes["data-testid"];
      if (testId) {
        valuesByTestId.set(testId, cell.text);
      }
    }

    rows.push({
      amazonId: identity.amazonId,
      name: identity.name,
      packagesDelivered: parseLocalizedAmazonNumber(valuesByTestId.get("delivered") || ""),
      dnrCount: parseLocalizedAmazonNumber(valuesByTestId.get("dnr") || ""),
      dnrDpmo: parseLocalizedAmazonNumber(valuesByTestId.get("dnr_dpmo") || ""),
      packagesShipped: parseLocalizedAmazonNumber(valuesByTestId.get("dispatched") || ""),
      rtsCount: parseLocalizedAmazonNumber(valuesByTestId.get("return_to_station_all") || ""),
      rtsPercent: parseLocalizedAmazonNumber(valuesByTestId.get("rts_all_percent") || ""),
      rtsDpmo: parseLocalizedAmazonNumber(valuesByTestId.get("rts_dpmo") || ""),
    });
  }

  if (rows.length === 0) {
    warnings.push("Aucune ligne Associate Overview exploitable");
  }

  return { rows, errors, warnings };
}
