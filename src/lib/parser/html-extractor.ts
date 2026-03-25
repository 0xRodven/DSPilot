// Extraction des CSVs base64 depuis le HTML Amazon

import { getISOWeek, getISOWeekYear } from "date-fns";

import {
  CSV_HREF_REGEX,
  DAILY_FILENAME_REGEX,
  STATION_FROM_DOWNLOAD_REGEX,
  TITLE_WEEK_REGEX,
  WEEKLY_FILENAME_REGEX,
} from "./constants";
import type { ExtractedCsv, ExtractionResult } from "./types";

function decodeBase64Csv(base64Data: string): string {
  if (typeof atob === "function") {
    return atob(base64Data);
  }

  return Buffer.from(base64Data, "base64").toString("utf-8");
}

/**
 * Extrait tous les CSVs base64 embarqués dans le HTML
 * @param html Contenu HTML du report Amazon
 * @returns CSVs extraits avec métadonnées de période
 */
export function extractCsvsFromHtml(html: string): ExtractionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const csvs: ExtractedCsv[] = [];
  let stationCode = "";
  let reportWeek = "";
  let year = 0;
  let week = 0;

  // Extraire la semaine depuis le titre
  const titleMatch = html.match(TITLE_WEEK_REGEX);
  if (titleMatch) {
    year = parseInt(titleMatch[1], 10);
    week = parseInt(titleMatch[2], 10);
    reportWeek = `${year}-${week.toString().padStart(2, "0")}`;
  }

  // Trouver tous les CSV data URIs
  const regex = new RegExp(CSV_HREF_REGEX.source, "g");
  let match: RegExpExecArray | null;

  match = regex.exec(html);
  while (match !== null) {
    const downloadFilename = match[1];
    const base64Data = match[2];

    // Extraire le code station depuis le premier fichier
    if (!stationCode) {
      const stationMatch = downloadFilename.match(STATION_FROM_DOWNLOAD_REGEX);
      if (stationMatch) {
        stationCode = stationMatch[1];
      }
    }

    try {
      // Décoder base64 → CSV text
      const csvContent = decodeBase64Csv(base64Data);

      // Déterminer le type de période
      const dailyMatch = downloadFilename.match(DAILY_FILENAME_REGEX);
      const weeklyMatch = downloadFilename.match(WEEKLY_FILENAME_REGEX);

      if (dailyMatch) {
        const [, y, m, d] = dailyMatch;
        const date = `${y}-${m}-${d}`;
        const dateObj = new Date(`${y}-${m}-${d}T00:00:00`);
        const weekNum = getISOWeek(dateObj);
        const weekYear = getISOWeekYear(dateObj);

        csvs.push({
          periodType: "daily",
          periodKey: date,
          year: weekYear,
          week: weekNum,
          date,
          csvContent,
          rows: [], // Rempli par csv-parser
        });
      } else if (weeklyMatch) {
        const [, y, w] = weeklyMatch;
        const parsedYear = parseInt(y, 10);
        const parsedWeek = parseInt(w, 10);

        csvs.push({
          periodType: "weekly",
          periodKey: `${parsedYear}-${parsedWeek.toString().padStart(2, "0")}`,
          year: parsedYear,
          week: parsedWeek,
          csvContent,
          rows: [],
        });

        // Utiliser les infos weekly si pas trouvé dans le titre
        if (!year) {
          year = parsedYear;
          week = parsedWeek;
          reportWeek = `${year}-${week.toString().padStart(2, "0")}`;
        }
      } else {
        errors.push(`Format de période inconnu: ${downloadFilename}`);
      }
    } catch (_error) {
      errors.push(`Échec décodage CSV: ${downloadFilename}`);
    }

    match = regex.exec(html);
  }

  if (csvs.length === 0) {
    errors.push("Aucun CSV embarqué trouvé dans le HTML");
  }

  return { stationCode, reportWeek, year, week, csvs, errors, warnings };
}
