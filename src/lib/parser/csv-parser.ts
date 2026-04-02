// Parser CSV pour les reports Amazon DWC/IADC

import { CSV_COLUMNS } from "./constants";
import type { ExtractedCsv, RawCsvRow } from "./types";

export interface CsvParseResult {
  rows: RawCsvRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse le contenu CSV en rows typées
 * @param csv CSV extrait avec son contenu
 * @returns Rows parsées avec erreurs/warnings
 */
export function parseCsvRows(csv: ExtractedCsv): CsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = csv.csvContent.split("\n");
  const rows: RawCsvRow[] = [];

  if (lines.length === 0) {
    errors.push(`CSV vide pour ${csv.periodKey}`);
    return { rows, errors, warnings };
  }

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (gère les champs quotés)
    const fields = parseCsvLine(line);

    if (fields.length < 5) {
      warnings.push(`Ligne ${i} ignorée: moins de 5 champs`);
      continue;
    }

    const total = parseInt(fields[CSV_COLUMNS.TOTAL], 10);
    if (Number.isNaN(total)) {
      warnings.push(`Ligne ${i}: total invalide "${fields[CSV_COLUMNS.TOTAL]}"`);
      continue;
    }

    if (total === 0) continue; // Skip zero rows silently

    rows.push({
      transporterId: fields[CSV_COLUMNS.TRANSPORTER_ID].trim(),
      type: fields[CSV_COLUMNS.TYPE].trim(),
      group: fields[CSV_COLUMNS.GROUP].trim(),
      shipmentReason: fields[CSV_COLUMNS.SHIPMENT_REASON].trim(),
      total,
    });
  }

  if (rows.length === 0) {
    warnings.push(`Aucune donnée trouvée dans ${csv.periodKey}`);
  }

  return { rows, errors, warnings };
}

/**
 * Parse une ligne CSV en gérant les champs quotés
 * @param line Ligne CSV brute
 * @returns Tableau de champs
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Double quote escape: "" → "
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Ajouter le dernier champ
  fields.push(current);

  return fields;
}
