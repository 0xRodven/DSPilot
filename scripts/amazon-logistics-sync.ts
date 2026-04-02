import { ConvexHttpClient } from "convex/browser";
import { type FunctionReference, makeFunctionReference } from "convex/server";

import { parseHtmlContent } from "../src/lib/parser";
import { parseAssociateOverviewHtml } from "../src/lib/parser/associate-overview-html";
import { parseDailyReportHtml } from "../src/lib/parser/daily-report-html";
import { parseDeliveryOverviewCsv } from "../src/lib/parser/delivery-overview-csv";
import { parseDriverNamesCsv } from "../src/lib/parser/driver-names-csv";
import { parseDriverRosterHtml } from "../src/lib/parser/driver-roster-html";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type DailyReportStat = {
  transporterId: string;
  date: string;
  rtsCount: number;
  dnrCount: number;
  podFails: number;
  ccFails: number;
};

type CliOptions = {
  stationCode: string;
  expectedAmazonStationCode?: string;
  dwcHtmlPath?: string;
  deliveryOverviewPath?: string;
  driverNamesPath?: string;
  associateOverviewHtmlPath?: string;
  driverRosterHtmlPath?: string;
  dailyReportHtmlPath?: string;
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
  associateWeeklyStats?: Array<{
    amazonId: string;
    name: string;
    packagesDelivered?: number;
    dnrCount?: number;
    dnrDpmo?: number;
    packagesShipped?: number;
    rtsCount?: number;
    rtsPercent?: number;
    rtsDpmo?: number;
  }>;
  driverRosterEntries?: Array<{
    name: string;
    providerId: string;
    dspName?: string;
    email?: string;
    phoneNumber?: string;
    onboardingTasks?: string;
    status: "ACTIVE" | "ONBOARDING" | "OFFBOARDED" | "UNKNOWN";
    serviceArea?: string;
  }>;
  dailyReportStats?: DailyReportStat[];
  source?: string;
  artifacts?: Array<{
    artifactType: string;
    logicalSource: string;
    filename: string;
    storagePath: string;
    mimeType?: string;
    sizeBytes?: number;
    sha256?: string;
    stationCode?: string;
    year?: number;
    week?: number;
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
  associateStatsCount?: number;
  rosterEntriesCount?: number;
  rosterLinkedCount?: number;
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

  const discoveredPaths = await discoverArtifactPaths(options);
  const dwcHtmlPath = discoveredPaths.dwcHtmlPath;

  if (!dwcHtmlPath) {
    throw new Error("Aucun fichier HTML DWC trouve. Passez --dwc-html ou --artifacts-dir.");
  }

  const dwcHtmlContent = await readFile(dwcHtmlPath, "utf-8");
  const parsedReport = parseHtmlContent(dwcHtmlContent, {
    filename: path.basename(dwcHtmlPath),
  });

  const supplementalPaths = await discoverSupplementaryPaths(options, parsedReport.year, parsedReport.week);

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

  const associateStats = await parseAssociateOverviewArtifacts(supplementalPaths.associateOverviewHtmlPaths);
  const rosterEntries = supplementalPaths.driverRosterHtmlPath
    ? parseDriverRosterHtml(await readFile(supplementalPaths.driverRosterHtmlPath, "utf-8"))
    : null;
  const dailyReportStats = await parseDailyReportArtifacts(supplementalPaths.dailyReportHtmlPaths);

  if (associateStats.errors.length > 0) {
    throw new Error(`Associate Overview invalide: ${associateStats.errors.join(" | ")}`);
  }

  if (dailyReportStats.errors.length > 0) {
    throw new Error(`Daily Report invalide: ${dailyReportStats.errors.join(" | ")}`);
  }

  if (rosterEntries && rosterEntries.errors.length > 0) {
    throw new Error(`Roster HTML invalide: ${rosterEntries.errors.join(" | ")}`);
  }

  const mergedDriverMappings = mergeDriverMappings(
    driverNames?.mappings || [],
    associateStats.rows.map((row) => ({
      amazonId: row.amazonId,
      name: row.name,
    })),
  );

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
    driverMappings: mergedDriverMappings,
    deliveryMetrics: deliveryOverview?.metrics,
    associateWeeklyStats: associateStats.rows,
    driverRosterEntries: rosterEntries?.rows,
    dailyReportStats: dailyReportStats.stats,
    source: options.artifactsDir ? "amazon_artifacts_dir" : "amazon_explicit_files",
    warnings: [
      ...parsedReport.warnings,
      ...(deliveryOverview ? [] : ["Delivery Overview absent"]),
      ...(driverNames ? [] : ["CSV noms livreurs absent"]),
      ...associateStats.warnings,
      ...(associateStats.rows.length > 0 ? [] : ["Associate Overview absent"]),
      ...(rosterEntries ? rosterEntries.warnings : []),
      ...(rosterEntries?.rows.length ? [] : ["Roster HTML absent"]),
      ...dailyReportStats.warnings,
      ...(dailyReportStats.stats.length > 0 ? [] : ["Daily Report absent"]),
    ],
  };

  payload.artifacts = await buildArtifactMetadata(
    {
      dwcHtmlPath,
      deliveryOverviewPath: discoveredPaths.deliveryOverviewPath,
      driverNamesPath: discoveredPaths.driverNamesPath,
      associateOverviewHtmlPaths: supplementalPaths.associateOverviewHtmlPaths,
      driverRosterHtmlPath: supplementalPaths.driverRosterHtmlPath,
      artifactsDir: options.artifactsDir,
    },
    {
      stationCode: parsedReport.stationCode,
      year: parsedReport.year,
      week: parsedReport.week,
    },
  );

  const summary = {
    dspilotStationCode: options.stationCode,
    reportStationCode: parsedReport.stationCode,
    year: parsedReport.year,
    week: parsedReport.week,
    files: {
      dwcHtmlPath,
      deliveryOverviewPath: discoveredPaths.deliveryOverviewPath || null,
      driverNamesPath: discoveredPaths.driverNamesPath || null,
      associateOverviewHtmlPaths: supplementalPaths.associateOverviewHtmlPaths,
      driverRosterHtmlPath: supplementalPaths.driverRosterHtmlPath || null,
    },
    counts: {
      transporters: parsedReport.transporterIds.length,
      dailyStats: parsedReport.dailyStats.length,
      weeklyStats: parsedReport.weeklyStats.length,
      deliveryMetrics: deliveryOverview?.metrics.length || 0,
      driverMappings: mergedDriverMappings.length,
      associateStats: associateStats.rows.length,
      driverRosterEntries: rosterEntries?.rows.length || 0,
      dailyReportStats: dailyReportStats.stats.length,
    },
    warnings: payload.warnings || [],
  };

  if (options.dryRun) {
    console.log(JSON.stringify({ dryRun: true, summary }, null, 2));
    return;
  }

  const convexUrl = requireEnv("NEXT_PUBLIC_CONVEX_URL");
  const convexDeployKey = requireEnv("CONVEX_DEPLOY_KEY");
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
    associateOverviewHtmlPath: process.env.DSPILOT_ASSOCIATE_OVERVIEW_HTML_PATH,
    driverRosterHtmlPath: process.env.DSPILOT_DRIVER_ROSTER_HTML_PATH,
    dailyReportHtmlPath: process.env.DSPILOT_DAILY_REPORT_HTML_PATH,
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
      case "--associate-overview-html":
        options.associateOverviewHtmlPath = requireOptionValue(arg, next);
        index += 1;
        break;
      case "--driver-roster-html":
        options.driverRosterHtmlPath = requireOptionValue(arg, next);
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
      case "--daily-report-html":
        options.dailyReportHtmlPath = requireOptionValue(arg, next);
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
      (await pickNewestMatchingFile(files, (filePath) => {
        const normalized = path.basename(filePath).toLowerCase();
        return (
          normalized.endsWith(".html") &&
          (normalized.includes("dwc-iadc-report") ||
            normalized.includes("dwc_iadc") ||
            (normalized.includes("dwc") && normalized.includes("iadc")) ||
            normalized.startsWith("scorecard_"))
        );
      })) ||
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
          (normalized.includes("concessions") ||
            normalized.includes("associ") ||
            normalized.includes("livreur") ||
            normalized.includes("roster"))
        );
      })),
  };
}

async function discoverSupplementaryPaths(options: CliOptions, year: number, week: number) {
  if (!options.artifactsDir) {
    return {
      associateOverviewHtmlPaths: options.associateOverviewHtmlPath ? [options.associateOverviewHtmlPath] : [],
      driverRosterHtmlPath: options.driverRosterHtmlPath,
      dailyReportHtmlPaths: options.dailyReportHtmlPath ? [options.dailyReportHtmlPath] : [],
    };
  }

  const files = await listFilesRecursively(options.artifactsDir);
  const associateWeekTag = `associate_w${week}_${year}`;

  const associateOverviewHtmlPaths = dedupePaths([
    ...(options.associateOverviewHtmlPath ? [options.associateOverviewHtmlPath] : []),
    ...files.filter((filePath) => {
      const filename = path.basename(filePath).toLowerCase();
      return (
        filename.endsWith(".html") && (filename.includes(associateWeekTag) || filename.includes("associate-overview") || filename.includes("associate_overview"))
      );
    }),
  ]);

  const driverRosterHtmlPath =
    options.driverRosterHtmlPath ||
    (await pickNewestMatchingFile(files, (filePath) => {
      const filename = path.basename(filePath).toLowerCase();
      return filename.endsWith(".html") && (filename.includes("all_associates") || filename.includes("roster"));
    }));

  const dailyReportHtmlPaths = dedupePaths([
    ...(options.dailyReportHtmlPath ? [options.dailyReportHtmlPath] : []),
    ...files.filter((filePath) => {
      const filename = path.basename(filePath).toLowerCase();
      return filename.endsWith(".html") && filename.includes("daily-report");
    }),
  ]);

  return {
    associateOverviewHtmlPaths,
    driverRosterHtmlPath,
    dailyReportHtmlPaths,
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

function dedupePaths(paths: string[]) {
  return Array.from(new Set(paths.filter(Boolean)));
}

async function buildArtifactMetadata(
  paths: {
    dwcHtmlPath?: string;
    deliveryOverviewPath?: string;
    driverNamesPath?: string;
    associateOverviewHtmlPaths?: string[];
    driverRosterHtmlPath?: string;
    artifactsDir?: string;
  },
  context: {
    stationCode: string;
    year: number;
    week: number;
  },
) {
  const explicitArtifacts = [
    paths.dwcHtmlPath
      ? {
          artifactType: "dwc_iadc_html",
          logicalSource: "amazon_dwc_iadc",
          filePath: paths.dwcHtmlPath,
          mimeType: "text/html",
        }
      : null,
    paths.deliveryOverviewPath
      ? {
          artifactType: "delivery_overview_csv",
          logicalSource: "amazon_delivery_overview",
          filePath: paths.deliveryOverviewPath,
          mimeType: "text/csv",
        }
      : null,
    paths.driverNamesPath
      ? {
          artifactType: "driver_roster_csv",
          logicalSource: "amazon_driver_roster",
          filePath: paths.driverNamesPath,
          mimeType: "text/csv",
        }
      : null,
    ...(paths.associateOverviewHtmlPaths || []).map((filePath) => ({
      artifactType: "associate_weekly_html",
      logicalSource: "amazon_associate_overview",
      filePath,
      mimeType: "text/html",
    })),
    paths.driverRosterHtmlPath
      ? {
          artifactType: "driver_roster_html",
          logicalSource: "amazon_driver_roster",
          filePath: paths.driverRosterHtmlPath,
          mimeType: "text/html",
        }
      : null,
  ].filter(Boolean) as Array<{
    artifactType: string;
    logicalSource: string;
    filePath: string;
    mimeType: string;
  }>;

  const manifests: Array<{
    artifactType: string;
    logicalSource: string;
    filePath: string;
    mimeType: string;
  }> = [];

  const discoveredArtifacts: Array<{
    artifactType: string;
    logicalSource: string;
    filePath: string;
    mimeType: string;
  }> = [];

  if (paths.artifactsDir) {
    for (const manifestName of ["manifest.json", "captures.json"]) {
      const manifestPath = path.join(paths.artifactsDir, manifestName);
      try {
        await stat(manifestPath);
        manifests.push({
          artifactType: manifestName === "manifest.json" ? "supplementary_manifest" : "capture_summary",
          logicalSource: "amazon_supplementary_reports",
          filePath: manifestPath,
          mimeType: "application/json",
        });
      } catch {
        // ignore missing manifest files
      }
    }

    const files = await listFilesRecursively(paths.artifactsDir);
    for (const filePath of files) {
      const filename = path.basename(filePath).toLowerCase();
      if (explicitArtifacts.some((artifact) => artifact.filePath === filePath)) {
        continue;
      }
      if (manifests.some((artifact) => artifact.filePath === filePath)) {
        continue;
      }

      if (filename.includes("daily-report")) {
        discoveredArtifacts.push({
          artifactType: "associate_daily_html",
          logicalSource: "amazon_associate_daily",
          filePath,
          mimeType: "text/html",
        });
      } else if (filename.includes("associate_w") || filename.includes("associate_overview")) {
        discoveredArtifacts.push({
          artifactType: "associate_weekly_html",
          logicalSource: "amazon_associate_overview",
          filePath,
          mimeType: "text/html",
        });
      } else if (filename.includes("dwc-iadc-report")) {
        discoveredArtifacts.push({
          artifactType: "dwc_iadc_html",
          logicalSource: "amazon_dwc_iadc",
          filePath,
          mimeType: "text/html",
        });
      } else if (filename.includes("dnr_investigations")) {
        discoveredArtifacts.push({
          artifactType: "dnr_investigations_html",
          logicalSource: "amazon_dnr_investigations",
          filePath,
          mimeType: "text/html",
        });
      } else if (
        filename.includes("all_associates") ||
        filename.includes("roster") ||
        filename.includes("concessions") ||
        filename.includes("associ")
      ) {
        discoveredArtifacts.push({
          artifactType: filename.endsWith(".csv") ? "driver_roster_csv" : "driver_roster_html",
          logicalSource: "amazon_driver_roster",
          filePath,
          mimeType: filename.endsWith(".csv") ? "text/csv" : "text/html",
        });
      }
    }
  }

  return await Promise.all(
    [...explicitArtifacts, ...manifests, ...discoveredArtifacts].map(async (artifact) => ({
      artifactType: artifact.artifactType,
      logicalSource: artifact.logicalSource,
      filename: path.basename(artifact.filePath),
      storagePath: artifact.filePath,
      mimeType: artifact.mimeType,
      sizeBytes: (await stat(artifact.filePath)).size,
      sha256: await computeSha256(artifact.filePath),
      stationCode: context.stationCode,
      year: context.year,
      week: context.week,
    })),
  );
}

async function computeSha256(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function parseAssociateOverviewArtifacts(filePaths: string[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byAmazonId = new Map<
    string,
    {
      amazonId: string;
      name: string;
      packagesDelivered?: number;
      dnrCount?: number;
      dnrDpmo?: number;
      packagesShipped?: number;
      rtsCount?: number;
      rtsPercent?: number;
      rtsDpmo?: number;
    }
  >();

  for (const filePath of filePaths) {
    const parsed = parseAssociateOverviewHtml(await readFile(filePath, "utf-8"));
    errors.push(...parsed.errors.map((error) => `${path.basename(filePath)}: ${error}`));
    warnings.push(...parsed.warnings.map((warning) => `${path.basename(filePath)}: ${warning}`));

    for (const row of parsed.rows) {
      const existing = byAmazonId.get(row.amazonId);
      if (!existing) {
        byAmazonId.set(row.amazonId, { ...row });
        continue;
      }

      byAmazonId.set(row.amazonId, {
        ...existing,
        ...pickDefinedFields(row),
        name: existing.name || row.name,
      });
    }
  }

  return {
    rows: Array.from(byAmazonId.values()),
    errors,
    warnings,
  };
}

async function parseDailyReportArtifacts(filePaths: string[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: DailyReportStat[] = [];

  for (const filePath of filePaths) {
    const parsed = parseDailyReportHtml(await readFile(filePath, "utf-8"), {
      filename: path.basename(filePath),
    });
    errors.push(...parsed.errors.map((e) => `${path.basename(filePath)}: ${e}`));
    warnings.push(...parsed.warnings.map((w) => `${path.basename(filePath)}: ${w}`));

    for (const row of parsed.stats) {
      stats.push({
        transporterId: row.transporterId,
        date: parsed.date,
        rtsCount: row.rtsCount,
        dnrCount: row.dnrCount,
        podFails: row.podFails,
        ccFails: row.ccFails,
      });
    }
  }

  return { stats, errors, warnings };
}

function pickDefinedFields<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null),
  ) as Partial<T>;
}

function mergeDriverMappings(
  primary: Array<{ amazonId: string; name: string }>,
  fallback: Array<{ amazonId: string; name: string }>,
) {
  const merged = new Map<string, string>();

  for (const mapping of fallback) {
    if (mapping.amazonId && mapping.name) {
      merged.set(mapping.amazonId, mapping.name);
    }
  }

  for (const mapping of primary) {
    if (mapping.amazonId && mapping.name) {
      merged.set(mapping.amazonId, mapping.name);
    }
  }

  return Array.from(merged.entries()).map(([amazonId, name]) => ({
    amazonId,
    name,
  }));
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
  --associate-overview-html <path>         HTML Associate Overview Amazon (optionnel)
  --driver-roster-html <path>              HTML Delivery Associates / roster (optionnel)
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
