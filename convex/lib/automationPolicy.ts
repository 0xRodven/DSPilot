import { getTier } from "./tier";

export type AutomationSeverity = "info" | "warning" | "critical";
export type AutomationConfidenceLevel = "low" | "medium" | "high";
export type AutomationDecisionType = "alert" | "digest" | "report_daily" | "report_weekly";
export type LogicalChannel = "ops" | "alerts" | "reports_daily" | "reports_weekly";

export type AlertEvidence = {
  label: string;
  value: string;
};

export type QualifiedAlertCandidate = {
  type: "dwc_drop" | "dwc_critical" | "coaching_pending" | "new_driver" | "tier_downgrade";
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

export function qualifyDwcCriticalAlert(args: { driverName: string; driverId: string; dwcPercent: number }) {
  const severity = args.dwcPercent < 88 ? "critical" : "warning";
  const confidenceScore = args.dwcPercent < 88 ? 0.96 : 0.9;

  return buildCandidate({
    type: "dwc_critical",
    severity,
    title: severity === "critical" ? "DWC critique" : "DWC à surveiller",
    message: `${args.driverName} a un DWC de ${round1(args.dwcPercent)}%`,
    summary: `Le driver est sous le seuil d'attention DSPilot sur la semaine en cours.`,
    confidenceScore,
    logicalChannel: "alerts",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "DWC", value: `${round1(args.dwcPercent)}%` },
      { label: "Tier DSPilot", value: getTier(args.dwcPercent) },
    ],
    recommendedAction:
      severity === "critical"
        ? "Prioriser un coaching immédiat et revoir le détail des défauts photo/contact."
        : "Surveiller la trajectoire du driver et préparer un coaching ciblé.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.dwcPercent),
    threshold: 90,
  });
}

export function qualifyDwcDropAlert(args: {
  driverName: string;
  driverId: string;
  currentDwc: number;
  previousDwc: number;
}) {
  const drop = args.previousDwc - args.currentDwc;
  const severity = drop >= 10 ? "critical" : "warning";
  const confidenceScore = drop >= 10 ? 0.92 : 0.82;

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
    ],
    recommendedAction:
      severity === "critical"
        ? "Ouvrir un coaching prioritaire et vérifier les causes principales de non-conformité."
        : "Analyser le mix défauts et confirmer s'il s'agit d'un incident isolé ou d'une dérive.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.currentDwc),
    previousValue: round1(args.previousDwc),
    threshold: 5,
  });
}

export function qualifyTierDowngradeAlert(args: {
  driverName: string;
  driverId: string;
  currentDwc: number;
  previousDwc: number;
}) {
  const currentTier = getTier(args.currentDwc);
  const previousTier = getTier(args.previousDwc);
  const severity = currentTier === "poor" ? "critical" : "warning";
  const confidenceScore = currentTier === "poor" ? 0.9 : 0.78;

  return buildCandidate({
    type: "tier_downgrade",
    severity,
    title: "Rétrogradation de tier",
    message: `${args.driverName} passe de ${previousTier} à ${currentTier}`,
    summary: "La classification DSPilot du driver se dégrade par rapport à la semaine précédente.",
    confidenceScore,
    logicalChannel: "alerts",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "Tier précédent", value: previousTier },
      { label: "Tier actuel", value: currentTier },
    ],
    recommendedAction:
      severity === "critical"
        ? "Traiter ce driver comme une priorité haute et vérifier l'historique des défauts."
        : "Suivre la dérive et confirmer qu'elle se traduit par un besoin de coaching.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: round1(args.currentDwc),
    previousValue: round1(args.previousDwc),
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

export function qualifyCoachingPendingAlert(args: { driverName: string; driverId: string; daysPending: number }) {
  const severity = args.daysPending > 21 ? "critical" : "warning";
  const confidenceScore = args.daysPending > 21 ? 0.88 : 0.76;

  return buildCandidate({
    type: "coaching_pending",
    severity,
    title: "Coaching en attente",
    message: `Le suivi de ${args.driverName} est en attente depuis ${args.daysPending} jours`,
    summary: "Une action de coaching ouverte n'a pas été clôturée dans les délais attendus.",
    confidenceScore,
    logicalChannel: "ops",
    evidence: [
      { label: "Driver", value: args.driverName },
      { label: "Jours en attente", value: `${args.daysPending}` },
    ],
    recommendedAction:
      severity === "critical"
        ? "Replanifier ou escalader le coaching immédiatement."
        : "Mettre à jour le statut du coaching ou fixer une nouvelle échéance.",
    targetPath: `/dashboard/drivers/${args.driverId}`,
    currentValue: args.daysPending,
    threshold: 14,
  });
}

export function shouldAutoSend(confidenceScore: number, minConfidence: number) {
  return confidenceScore >= minConfidence;
}
