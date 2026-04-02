export type AutomationSeverity = "info" | "warning" | "critical";
export type AutomationConfidenceLevel = "low" | "medium" | "high";
export type AutomationDecisionType = "alert" | "digest" | "report_daily" | "report_weekly";
export type LogicalChannel = "ops" | "alerts" | "reports_daily" | "reports_weekly";

export type AlertEvidence = {
  label: string;
  value: string;
};

export type QualifiedAlertCandidate = {
  type: "dwc_drop" | "dwc_below_target" | "coaching_pending" | "new_driver";
  severity: Exclude<AutomationSeverity, "info">;
  title: string;
  message: string;
  summary: string;
  confidenceScore: number;
  confidenceLevel: AutomationConfidenceLevel;
  logicalChannel: LogicalChannel;
  evidence: AlertEvidence[];
  recommendedAction: string;
  targetPath?: string;
  currentValue?: number;
  previousValue?: number;
  threshold?: number;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function toConfidenceLevel(score: number): AutomationConfidenceLevel {
  if (score >= 0.85) return "high";
  if (score >= 0.65) return "medium";
  return "low";
}

function buildCandidate(candidate: Omit<QualifiedAlertCandidate, "confidenceLevel">): QualifiedAlertCandidate {
  return {
    ...candidate,
    confidenceLevel: toConfidenceLevel(candidate.confidenceScore),
  };
}

export function qualifyDwcBelowTargetAlert(args: {
  driverName: string;
  driverId: string;
  dwcPercent: number;
  dwcTarget: number;
}) {
  // Critical if more than 5 points below target, warning otherwise
  const gapFromTarget = args.dwcTarget - args.dwcPercent;
  const severity = gapFromTarget >= 5 ? "critical" : "warning";
  const confidenceScore = gapFromTarget >= 5 ? 0.96 : 0.9;

  return buildCandidate({
    type: "dwc_below_target",
    severity,
    title: severity === "critical" ? "DWC critique" : "DWC sous objectif",
    message: `${args.driverName} a un DWC de ${round1(args.dwcPercent)}% (objectif: ${args.dwcTarget}%)`,
    summary: `Le driver est sous l'objectif station de ${args.dwcTarget}% sur la semaine en cours.`,
    confidenceScore,
    logicalChannel: "alerts",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "DWC", value: `${round1(args.dwcPercent)}%` },
      { label: "Objectif station", value: `${args.dwcTarget}%` },
    ],
    recommendedAction:
      severity === "critical"
        ? "Prioriser un coaching immédiat et revoir le détail des défauts photo/contact."
        : "Surveiller la trajectoire du driver et préparer un coaching ciblé.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.dwcPercent),
    threshold: args.dwcTarget,
  });
}

export function qualifyDwcDropAlert(args: {
  driverName: string;
  driverId: string;
  currentDwc: number;
  previousDwc: number;
  dropThreshold: number;
}) {
  const drop = args.previousDwc - args.currentDwc;
  // Critical if drop is double the threshold
  const severity = drop >= args.dropThreshold * 2 ? "critical" : "warning";
  const confidenceScore = drop >= args.dropThreshold * 2 ? 0.92 : 0.82;

  return buildCandidate({
    type: "dwc_drop",
    severity,
    title: "Chute DWC",
    message: `${args.driverName} a chuté de ${round1(drop)} points (${round1(args.previousDwc)}% → ${round1(args.currentDwc)}%)`,
    summary: "La performance hebdomadaire décroche nettement par rapport à la semaine précédente.",
    confidenceScore,
    logicalChannel: "alerts",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "Semaine courante", value: `${round1(args.currentDwc)}%` },
      { label: "Semaine précédente", value: `${round1(args.previousDwc)}%` },
      { label: "Seuil alerte", value: `${args.dropThreshold} pts` },
    ],
    recommendedAction:
      severity === "critical"
        ? "Ouvrir un coaching prioritaire et vérifier les causes principales de non-conformité."
        : "Analyser le mix défauts et confirmer s'il s'agit d'un incident isolé ou d'une dérive.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.currentDwc),
    previousValue: round1(args.previousDwc),
    threshold: args.dropThreshold,
  });
}

export function qualifyNewDriverAlert(args: { driverName: string; driverId: string; dwcPercent: number }) {
  return buildCandidate({
    type: "new_driver",
    severity: "warning",
    title: "Nouveau driver à suivre",
    message: `${args.driverName} effectue sa première semaine visible (${round1(args.dwcPercent)}%)`,
    summary: "Le driver est nouveau dans le jeu de données et doit être cadré tôt.",
    confidenceScore: 0.72,
    logicalChannel: "alerts",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "DWC", value: `${round1(args.dwcPercent)}%` },
    ],
    recommendedAction: "Valider l'onboarding et définir un suivi rapproché sur les premières semaines.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.dwcPercent),
  });
}

export function qualifyCoachingPendingAlert(args: {
  driverName: string;
  driverId: string;
  daysPending: number;
  maxDays: number;
}) {
  // Critical if pending for more than 1.5x the max days
  const criticalThreshold = Math.round(args.maxDays * 1.5);
  const severity = args.daysPending > criticalThreshold ? "critical" : "warning";
  const confidenceScore = args.daysPending > criticalThreshold ? 0.88 : 0.76;

  return buildCandidate({
    type: "coaching_pending",
    severity,
    title: "Coaching en attente",
    message: `Le suivi de ${args.driverName} est en attente depuis ${args.daysPending} jours (max: ${args.maxDays}j)`,
    summary: "Une action de coaching ouverte n'a pas été clôturée dans les délais attendus.",
    confidenceScore,
    logicalChannel: "ops",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "Jours en attente", value: `${args.daysPending}` },
      { label: "Seuil station", value: `${args.maxDays} jours` },
    ],
    recommendedAction:
      severity === "critical"
        ? "Replanifier ou escalader le coaching immédiatement."
        : "Mettre à jour le statut du coaching ou fixer une nouvelle échéance.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: args.daysPending,
    threshold: args.maxDays,
  });
}

export function shouldAutoSend(confidenceScore: number, minConfidence: number) {
  return confidenceScore >= minConfidence;
}
