import { extractFirstTable } from "./html-table";

export type DriverRosterEntry = {
  name: string;
  providerId: string;
  dspName?: string;
  email?: string;
  phoneNumber?: string;
  onboardingTasks?: string;
  status: "ACTIVE" | "ONBOARDING" | "OFFBOARDED" | "UNKNOWN";
  serviceArea?: string;
};

export type ParseDriverRosterHtmlResult = {
  rows: DriverRosterEntry[];
  errors: string[];
  warnings: string[];
};

function normalizeStatus(value: string): DriverRosterEntry["status"] {
  const normalized = value.trim().toUpperCase();
  if (normalized === "ACTIVE" || normalized === "ONBOARDING" || normalized === "OFFBOARDED") {
    return normalized;
  }
  return "UNKNOWN";
}

export function parseDriverRosterHtml(html: string): ParseDriverRosterHtmlResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const table = extractFirstTable(
    html,
    (tableHtml) =>
      tableHtml.includes("Provider ID") && tableHtml.includes("Phone Number") && tableHtml.includes("Onboarding Tasks"),
  );

  if (!table || table.rows.length < 2) {
    errors.push("Tableau Delivery Associates introuvable");
    return { rows: [], errors, warnings };
  }

  const rows: DriverRosterEntry[] = [];

  for (const row of table.rows.slice(1)) {
    const cells = row.cells.map((cell) => cell.text.trim());
    if (cells.length < 7) {
      warnings.push("Ligne roster ignoree: moins de 7 colonnes");
      continue;
    }

    const name = cells[0] || "";
    const providerId = cells[1] || "";
    if (!name || !providerId) {
      warnings.push(`Ligne roster ignoree: name/providerId manquant (${cells.join(" | ")})`);
      continue;
    }

    rows.push({
      name,
      providerId,
      dspName: cells[2] || undefined,
      email: cells[3] || undefined,
      phoneNumber: cells[4] || undefined,
      onboardingTasks: cells[5] || undefined,
      status: normalizeStatus(cells[6] || ""),
      serviceArea: cells[7] || undefined,
    });
  }

  if (rows.length === 0) {
    warnings.push("Aucune ligne Delivery Associates exploitable");
  }

  return { rows, errors, warnings };
}
