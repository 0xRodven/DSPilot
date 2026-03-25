import { ConvexHttpClient } from "convex/browser";
import { type FunctionReference, makeFunctionReference } from "convex/server";

import { parseHtmlContent } from "../src/lib/parser";
import { parseDeliveryOverviewCsv } from "../src/lib/parser/delivery-overview-csv";
import { parseDriverNamesCsv } from "../src/lib/parser/driver-names-csv";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type CliOptions = {
  stationCode: string;
  expectedAmazonStationCode?: string;
  dwcHtmlPath?: string;
  deliveryOverviewPath?: string;
  driverNamesPath?: string;
  artifactsDir?: string;
  importedBy: string;
  dryRun: boolean;
};

type ResolvedStation = {
  _id: string;
  code: string;
  name: string;
  organizationId?: string;
} | null;

type AutomationActionArgs = {
  stationId: string;
  filename: string;
  year: number;
  week: number;
  importedBy: string;
  reportStationCode: string;
  transporterIds: string[];
  dailyStats: Array<{
    transporterId: string;
    date: string;
    year: number;
    week: number;
    dwcCompliant: number;
    dwcMisses: number;
    failedAttempts: number;
    iadcCompliant: number;
    iadcNonCompliant: number;
    dwcBreakdown?: {
      contactMiss: number;
      photoDefect: number;
      noPhoto: number;
      otpMiss: number;
      other: number;
    };
    iadcBreakdown?: {
      mailbox: number;
      unattended: number;
      safePlace: number;
      other: number;
    };
  }>;
  weeklyStats: Array<{
    transporterId: string;
    year: number;
    week: number;
    dwcCompliant: number;
    dwcMisses: number;
    failedAttempts: number;
    iadcCompliant: number;
    iadcNonCompliant: number;
    dwcBreakdown?: {
      contactMiss: number;
      photoDefect: number;
      noPhoto: number;
      otpMiss: number;
      other: number;
    };
    iadcBreakdown?: {
      mailbox: number;
      unattended: number;
      safePlace: number;
      other: number;
    };
  }>;
  driverMappings?: Array<{
    amazonId: string;
    name: string;
  }>;
  deliveryMetrics?: Array<{
    metricName: string;
    year: number;
    week: number;
    value: string;
    numericValue?: number;
  }>;
  warnings?: string[];
};

type AutomationActionResult = {
  importId: string;
  stationId: string;
  filename: string;
  reportStationCode: string;
  year: number;
  week: number;
  driversImported: number;
  newDriversCount: number;
  namesUpdated: number;
  dailyRecordsCount: number;
  weeklyRecordsCount: number;
  deliveryMetricsCount: number;
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  warnings: string[];
};

type AdminConvexHttpClient = {
  setAdminAuth(token: string): void;
  query(reference: typeof resolveStationByCodeRef, args: { code: string }): Promise<ResolvedStation>;
  action(reference: typeof ingestParsedAmazonReportRef, args: AutomationActionArgs): Promise<AutomationActionResult>;
};

const resolveStationByCodeRef = makeFunctionReference(
  "automation:resolveStationByCode",
) as unknown as FunctionReference<"query", "internal", { code: string }, ResolvedStation>;

const ingestParsedAmazonReportRef = makeFunctionReference(
  "automation:ingestParsedAmazonReport",
) as unknown as FunctionReference<"action", "internal", AutomationActionArgs, AutomationActionResult>;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const convexUrl = requireEnv("NEXT_PUBLIC_CONVEX_URL");
  const convexDeployKey = requireEnv("CONVEX_DEPLOY_KEY");

  const discoveredPaths = await discoverArtifactPaths(options);
  const dwcHtmlPath = discoveredPaths.dwcHtmlPath;

  if (!dwcHtmlPath) {
    throw new Error("Aucun fichier HTML DWC trouve. Passez --dwc-html ou --artifacts-dir.");
  }

  const dwcHtmlContent = await readFile(dwcHtmlPath, "utf-8");
  const parsedReport = parseHtmlContent(dwcHtmlContent, {
    filename: path.basename(dwcHtmlPath),
  });

  if (options.expectedAmazonStationCode && parsedReport.stationCode !== options.expectedAmazonStationCode) {
    throw new Error(
      `Station Amazon inattendue: ${parsedReport.stationCode} (attendu: ${options.expectedAmazonStationCode})`,
    );
  }

  const deliveryOverview = discoveredPaths.deliveryOverviewPath
    ? parseDeliveryOverviewCsv(await readFile(discoveredPaths.deliveryOverviewPath, "utf-8"))
    : null;

  if (deliveryOverview && deliveryOverview.errors.length > 0) {
    throw new Error(`Delivery Overview invalide: ${deliveryOverview.errors.join(" | ")}`);
  }

  const driverNames = discoveredPaths.driverNamesPath
    ? parseDriverNamesCsv(await readFile(discoveredPaths.driverNamesPath, "utf-8"))
    : null;

  if (driverNames && driverNames.errors.length > 0) {
    throw new Error(`CSV noms livreurs invalide: ${driverNames.errors.join(" | ")}`);
  }

  const payload: AutomationActionArgs = {
    stationId: "",
    filename: parsedReport.filename,
    year: parsedReport.year,
    week: parsedReport.week,
    importedBy: options.importedBy,
    reportStationCode: parsedReport.stationCode,
    transporterIds: parsedReport.transporterIds,
    dailyStats: parsedReport.dailyStats.map((stat) => ({
      transporterId: stat.transporterId,
      date: requireDailyDate(stat.date, stat.transporterId),
      year: stat.year,
      week: stat.week,
      dwcCompliant: stat.dwcCompliant,
      dwcMisses: stat.dwcMisses,
      failedAttempts: stat.failedAttempts,
      iadcCompliant: stat.iadcCompliant,
      iadcNonCompliant: stat.iadcNonCompliant,
      dwcBreakdown: stat.dwcBreakdown,
      iadcBreakdown: stat.iadcBreakdown
        ? {
            mailbox: stat.iadcBreakdown.mailbox,
            unattended: stat.iadcBreakdown.unattended,
            safePlace: stat.iadcBreakdown.safePlace,
            other: stat.iadcBreakdown.other,
          }
        : undefined,
    })),
    weeklyStats: parsedReport.weeklyStats.map((stat) => ({
      transporterId: stat.transporterId,
      year: stat.year,
      week: stat.week,
      dwcCompliant: stat.dwcCompliant,
      dwcMisses: stat.dwcMisses,
      failedAttempts: stat.failedAttempts,
      iadcCompliant: stat.iadcCompliant,
      iadcNonCompliant: stat.iadcNonCompliant,
      dwcBreakdown: stat.dwcBreakdown,
      iadcBreakdown: stat.iadcBreakdown
        ? {
            mailbox: stat.iadcBreakdown.mailbox,
            unattended: stat.iadcBreakdown.unattended,
            safePlace: stat.iadcBreakdown.safePlace,
            other: stat.iadcBreakdown.other,
          }
        : undefined,
    })),
    driverMappings: driverNames?.mappings,
    deliveryMetrics: deliveryOverview?.metrics,
    warnings: [
      ...parsedReport.warnings,
      ...(deliveryOverview ? [] : ["Delivery Overview absent"]),
      ...(driverNames ? [] : ["CSV noms livreurs absent"]),
    ],
  };

  const summary = {
    dspilotStationCode: options.stationCode,
    reportStationCode: parsedReport.stationCode,
    year: parsedReport.year,
    week: parsedReport.week,
    files: {
      dwcHtmlPath,
      deliveryOverviewPath: discoveredPaths.deliveryOverviewPath || null,
      driverNamesPath: discoveredPaths.driverNamesPath || null,
    },
    counts: {
      transporters: parsedReport.transporterIds.length,
      dailyStats: parsedReport.dailyStats.length,
      weeklyStats: parsedReport.weeklyStats.length,
      deliveryMetrics: deliveryOverview?.metrics.length || 0,
      driverMappings: driverNames?.mappings.length || 0,
    },
    warnings: payload.warnings || [],
  };

  if (options.dryRun) {
    console.log(JSON.stringify({ dryRun: true, summary }, null, 2));
    return;
  }

  const client = new ConvexHttpClient(convexUrl) as unknown as AdminConvexHttpClient;
  client.setAdminAuth(convexDeployKey);

  const station = await client.query(resolveStationByCodeRef, {
    code: options.stationCode,
  });

  if (!station) {
    throw new Error(`Aucune station DSPilot trouvee pour le code "${options.stationCode}".`);
  }

  payload.stationId = station._id;

  const result = await client.action(ingestParsedAmazonReportRef, payload);

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        summary,
        result,
      },
      null,
      2,
    ),
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {
    stationCode: process.env.DSPILOT_STATION_CODE,
    expectedAmazonStationCode: process.env.DSPILOT_EXPECTED_AMAZON_STATION_CODE,
    dwcHtmlPath: process.env.DSPILOT_DWC_HTML_PATH,
    deliveryOverviewPath: process.env.DSPILOT_DELIVERY_OVERVIEW_PATH,
    driverNamesPath: process.env.DSPILOT_DRIVER_NAMES_PATH,
    artifactsDir: process.env.DSPILOT_ARTIFACTS_DIR,
    importedBy: process.env.DSPILOT_AUTOMATION_IMPORTED_BY || "system:amazon-automation",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--station-code":
        options.stationCode = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--expected-amazon-station-code":
        options.expectedAmazonStationCode = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--dwc-html":
        options.dwcHtmlPath = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--delivery-overview":
        options.deliveryOverviewPath = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--driver-names":
        options.driverNamesPath = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--artifacts-dir":
        options.artifactsDir = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--imported-by":
        options.importedBy = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        return options as CliOptions;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Option inconnue: ${arg}`);
        }
    }
  }

  if (!options.stationCode) {
    throw new Error("Station DSPilot manquante. Utilisez --station-code.");
  }

  return options as CliOptions;
}

async function discoverArtifactPaths(options: CliOptions) {
  if (!options.artifactsDir) {
    return {
      dwcHtmlPath: options.dwcHtmlPath,
      deliveryOverviewPath: options.deliveryOverviewPath,
      driverNamesPath: options.driverNamesPath,
    };
  }

  const files = await listFilesRecursively(options.artifactsDir);

  return {
    dwcHtmlPath:
      options.dwcHtmlPath ||
      (await pickNewestMatchingFile(files, (filePath) => filePath.toLowerCase().endsWith(".html"))),
    deliveryOverviewPath:
      options.deliveryOverviewPath ||
      (await pickNewestMatchingFile(files, (filePath) => {
        const normalized = filePath.toLowerCase();
        return (
          normalized.endsWith(".csv") &&
          (normalized.includes("delivery_overview") ||
            normalized.includes("delivery-overview") ||
            normalized.includes("overview"))
        );
      })),
    driverNamesPath:
      options.driverNamesPath ||
      (await pickNewestMatchingFile(files, (filePath) => {
        const normalized = filePath.toLowerCase();
        return (
          normalized.endsWith(".csv") &&
          (normalized.includes("concessions") || normalized.includes("associ") || normalized.includes("livreur"))
        );
      })),
  };
}

async function listFilesRecursively(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function pickNewestMatchingFile(files: string[], predicate: (filePath: string) => boolean) {
  const matches = files.filter(predicate);
  if (matches.length === 0) {
    return undefined;
  }

  const stats = await Promise.all(
    matches.map(async (filePath) => ({
      filePath,
      mtimeMs: (await stat(filePath)).mtimeMs,
    })),
  );

  return stats.sort((left, right) => right.mtimeMs - left.mtimeMs)[0]?.filePath;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

function requireOptionValue(option: string, value: string | undefined) {
  if (!value || value.startsWith("--")) {
    throw new Error(`Valeur manquante pour ${option}`);
  }
  return value;
}

function requireDailyDate(date: string | undefined, transporterId: string) {
  if (!date) {
    throw new Error(`Stat daily sans date pour ${transporterId}`);
  }
  return date;
}

function printHelp() {
  console.log(`Usage:
  npm run amazon:ingest -- --station-code DIF1 --dwc-html /tmp/report.html
  npm run amazon:ingest -- --station-code DIF1 --artifacts-dir /tmp/amazon-downloads --dry-run

Options:
  --station-code <code>                    Code station DSPilot a cibler
  --expected-amazon-station-code <code>    Verifie le code station detecte dans le report
  --dwc-html <path>                        Export HTML DWC/IADC Amazon
  --delivery-overview <path>               CSV Delivery Overview (optionnel)
  --driver-names <path>                    CSV noms livreurs / concessions (optionnel)
  --artifacts-dir <path>                   Dossier a scanner pour auto-detecter les fichiers
  --imported-by <id>                       Identifiant logique pour l'historique d'import
  --dry-run                                Parse uniquement, sans ecriture Convex
  --help                                   Affiche cette aide
`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[amazon-logistics-sync] ${message}`);
  process.exit(1);
});
