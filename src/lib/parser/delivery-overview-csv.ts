/**
 * Parser pour le CSV Amazon "DSP_Delivery_Overview"
 * Extrait les métriques de livraison par semaine
 */

export interface DeliveryMetricData {
  metricName: string;
  year: number;
  week: number;
  value: string;
  numericValue?: number;
}

export interface DetectedWeek {
  year: number;
  week: number;
  label: string;
}

export interface ParseDeliveryOverviewResult {
  metrics: DeliveryMetricData[];
  detectedWeeks: DetectedWeek[];
  errors: string[];
}

/**
 * Parse une ligne CSV avec gestion des quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push last field
  result.push(current.trim());

  return result;
}

/**
 * Parse une valeur numérique française (ex: "24 436" -> 24436, "97.53%" -> 97.53)
 */
function parseNumericValue(value: string): number | undefined {
  // Remove quotes and trim
  const cleaned = value.replace(/[""]/g, "").trim();

  // Handle empty values
  if (!cleaned || cleaned === "-" || cleaned === "N/A") {
    return undefined;
  }

  // Remove percentage sign if present
  const withoutPercent = cleaned.replace(/%$/, "");

  // Replace French decimal comma with dot, remove space separators
  const normalized = withoutPercent
    .replace(/\s/g, "") // Remove spaces (thousand separators)
    .replace(",", "."); // French decimal to international

  const num = parseFloat(normalized);
  return isNaN(num) ? undefined : num;
}

/**
 * Infer year from week number based on current date
 * - If importing week 51/52 in January, assume previous year
 * - If importing week 1/2 in December, assume next year
 */
function inferYear(weekNum: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // If importing week 51/52 in January/February, assume previous year
  if (currentMonth <= 2 && weekNum >= 48) {
    return currentYear - 1;
  }
  // If importing week 1/2/3/4 in November/December, assume next year
  if (currentMonth >= 11 && weekNum <= 4) {
    return currentYear + 1;
  }
  return currentYear;
}

/**
 * Extract week number from header like "Semaine 51" or "Week 51"
 */
function extractWeekNumber(header: string): number | null {
  // Match "Semaine X" or "Week X" or just "SX" or "WX"
  const match = header.match(/(?:Semaine|Week|S|W)\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parse le contenu d'un fichier CSV Delivery Overview
 *
 * Format attendu:
 * "Métrique","Semaine 51","Semaine 52","Semaine 1","Semaine 2"
 * "Colis livrés","24 436","13 123","12 627","13 231"
 */
export function parseDeliveryOverviewCsv(content: string): ParseDeliveryOverviewResult {
  const errors: string[] = [];
  const metrics: DeliveryMetricData[] = [];
  const detectedWeeks: DetectedWeek[] = [];

  // Remove BOM if present
  let cleanContent = content;
  if (content.charCodeAt(0) === 0xfeff) {
    cleanContent = content.slice(1);
  }

  // Split into lines
  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    errors.push(
      "Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données"
    );
    return { metrics, detectedWeeks, errors };
  }

  // Parse header
  const header = parseCsvLine(lines[0]);

  if (header.length < 2) {
    errors.push("Le fichier doit contenir au moins deux colonnes");
    return { metrics, detectedWeeks, errors };
  }

  // First column should be "Métrique" or similar
  const firstCol = header[0].replace(/[""]/g, "").toLowerCase().trim();
  if (!["métrique", "metrique", "metric", "nom"].includes(firstCol)) {
    errors.push(
      `Première colonne inattendue: "${header[0]}". Attendu: "Métrique"`
    );
  }

  // Parse week columns (columns 1+)
  const weekColumns: { index: number; week: number; year: number; label: string }[] = [];

  for (let i = 1; i < header.length; i++) {
    const headerValue = header[i].replace(/[""]/g, "").trim();
    const weekNum = extractWeekNumber(headerValue);

    if (weekNum !== null) {
      const year = inferYear(weekNum);
      weekColumns.push({
        index: i,
        week: weekNum,
        year,
        label: headerValue,
      });
      detectedWeeks.push({ year, week: weekNum, label: headerValue });
    } else if (headerValue) {
      errors.push(
        `En-tête de colonne non reconnu: "${headerValue}". Format attendu: "Semaine X"`
      );
    }
  }

  if (weekColumns.length === 0) {
    errors.push("Aucune colonne de semaine détectée");
    return { metrics, detectedWeeks, errors };
  }

  // Parse data rows
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const line = lines[rowIndex].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);
    const metricName = fields[0]?.replace(/[""]/g, "").trim();

    if (!metricName) {
      continue; // Skip empty rows
    }

    // Extract value for each week column
    for (const col of weekColumns) {
      const rawValue = fields[col.index] || "";
      const value = rawValue.replace(/[""]/g, "").trim();

      if (value) {
        metrics.push({
          metricName,
          year: col.year,
          week: col.week,
          value,
          numericValue: parseNumericValue(value),
        });
      }
    }
  }

  return { metrics, detectedWeeks, errors };
}

/**
 * Parse un fichier CSV
 */
export async function parseDeliveryOverviewCsvFile(
  file: File
): Promise<ParseDeliveryOverviewResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseDeliveryOverviewCsv(content);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };

    reader.readAsText(file, "utf-8");
  });
}
