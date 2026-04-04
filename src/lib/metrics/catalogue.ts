export type MetricGranularity = "daily" | "weekly" | "rolling" | "snapshot";

export type MetricUnit = "percentage" | "count" | "rate" | "ratio" | "score" | "days" | "unknown";

export type MetricSourceKind = "amazon_export" | "amazon_portal" | "dspilot_derived" | "mixed";

export type MetricThreshold = {
  label: string;
  min?: number;
  max?: number;
  note?: string;
};

export type MetricDefinition = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  granularity: MetricGranularity;
  unit: MetricUnit;
  sourceKind: MetricSourceKind;
  sourceReport: string;
  sourceFieldStatus: "verified" | "inferred" | "needs_verification";
  derived: boolean;
  formula?: string;
  businessWhy: string;
  recommendedAction?: string;
  thresholds?: MetricThreshold[];
};

export const metricCatalogue = {
  dwc: {
    key: "dwc",
    label: "Delivery With Care",
    shortLabel: "DWC",
    description: "Weekly delivery quality score sourced from the Amazon DWC-IADC export.",
    granularity: "weekly",
    unit: "percentage",
    sourceKind: "amazon_export",
    sourceReport: "DWC-IADC weekly export",
    sourceFieldStatus: "verified",
    derived: false,
    businessWhy: "Primary weekly quality signal used to track station and driver performance.",
    recommendedAction: "Use for weekly coaching, driver segmentation, and executive reporting.",
  },
  iadc: {
    key: "iadc",
    label: "IADC",
    shortLabel: "IADC",
    description: "Weekly IADC score sourced from the Amazon DWC-IADC export.",
    granularity: "weekly",
    unit: "percentage",
    sourceKind: "amazon_export",
    sourceReport: "DWC-IADC weekly export",
    sourceFieldStatus: "verified",
    derived: false,
    businessWhy: "Secondary weekly quality signal used alongside DWC in manager reviews.",
    recommendedAction: "Use to identify drivers needing process reinforcement and follow-up coaching.",
  },
  dnr: {
    key: "dnr",
    label: "Did Not Receive",
    shortLabel: "DNR",
    description: "Customer non-receipt signal sourced from Amazon daily or investigation reports.",
    granularity: "daily",
    unit: "count",
    sourceKind: "mixed",
    sourceReport: "Daily Report / DNR Investigations",
    sourceFieldStatus: "needs_verification",
    derived: false,
    businessWhy: "High DNR levels indicate customer experience risk and should trigger rapid investigation.",
    recommendedAction:
      "Escalate repeated DNR cases, inspect delivery proof, and reinforce proof-of-delivery discipline.",
  },
  deliveryMissesRisk: {
    key: "deliveryMissesRisk",
    label: "Delivery Misses - DNR Risk",
    shortLabel: "DNR",
    description: "Weekly DWC miss volume flagged as DNR risk in the Amazon DWC-IADC export.",
    granularity: "weekly",
    unit: "count",
    sourceKind: "amazon_export",
    sourceReport: "DWC-IADC weekly export",
    sourceFieldStatus: "verified",
    derived: false,
    businessWhy:
      "Surfaces weekly DWC misses with customer-risk characteristics, but is not the same as confirmed DNR from daily or investigations reports.",
    recommendedAction: "Use as an early weekly risk signal and avoid presenting it as confirmed DNR.",
  },
  dpmo: {
    key: "dpmo",
    label: "Defects Per Million Opportunities",
    shortLabel: "DPMO",
    description: "Daily defect rate signal sourced from Amazon daily associate reporting.",
    granularity: "daily",
    unit: "rate",
    sourceKind: "amazon_export",
    sourceReport: "Daily Report / Associate Daily export",
    sourceFieldStatus: "needs_verification",
    derived: false,
    businessWhy:
      "Captures defect intensity and helps surface hidden quality degradation before weekly scorecards move materially.",
    recommendedAction: "Use as an early warning indicator for same-week coaching and intervention.",
  },
  rts: {
    key: "rts",
    label: "Return To Station",
    shortLabel: "RTS",
    description: "Daily return-to-station metric sourced from Amazon daily associate reporting.",
    granularity: "daily",
    unit: "count",
    sourceKind: "amazon_export",
    sourceReport: "Daily Report / Associate Daily export",
    sourceFieldStatus: "needs_verification",
    derived: false,
    businessWhy: "Tracks undelivered volume returning to station and signals route execution problems.",
    recommendedAction: "Review repeated RTS patterns, route difficulty, and coaching opportunities.",
  },
  photoDefects: {
    key: "photoDefects",
    label: "Photo Defects",
    shortLabel: "Photo defects",
    description: "Weekly breakdown bucket derived from the DWC-IADC quality breakdown when present.",
    granularity: "weekly",
    unit: "count",
    sourceKind: "amazon_export",
    sourceReport: "DWC-IADC weekly export",
    sourceFieldStatus: "needs_verification",
    derived: false,
    businessWhy: "Helps isolate proof-of-delivery quality issues that materially impact DWC.",
    recommendedAction: "Use to target photo-quality coaching and identify recurring proof issues.",
  },
  daysActive: {
    key: "daysActive",
    label: "Days Active",
    shortLabel: "Jours actifs",
    description: "DSPilot-derived activity count built from daily records over the selected period.",
    granularity: "rolling",
    unit: "days",
    sourceKind: "dspilot_derived",
    sourceReport: "Derived from Daily Report / Associate Daily export",
    sourceFieldStatus: "needs_verification",
    derived: true,
    formula: "Count unique days in the selected period where the driver has qualifying daily activity.",
    businessWhy: "Adds operational context when comparing performance across drivers with different activity levels.",
    recommendedAction: "Use for context only; do not present as an Amazon-native KPI.",
  },
  tier: {
    key: "tier",
    label: "Driver Tier",
    shortLabel: "Tier",
    description: "DSPilot classification bucket derived from canonical weekly performance thresholds.",
    granularity: "weekly",
    unit: "score",
    sourceKind: "dspilot_derived",
    sourceReport: "Derived from weekly scorecard metrics",
    sourceFieldStatus: "needs_verification",
    derived: true,
    formula: "Map canonical weekly score thresholds to driver buckets after threshold policy is finalized.",
    businessWhy:
      "Provides a fast segmentation layer for managers, but must be presented as derived unless Amazon-official thresholds are verified.",
    recommendedAction:
      "Do not automate alerts, PDFs, or WhatsApp wording from this field until one threshold model is locked.",
  },
} satisfies Record<string, MetricDefinition>;

export type MetricKey = keyof typeof metricCatalogue;

export function getMetricDefinition(metric: MetricKey): MetricDefinition {
  return metricCatalogue[metric];
}
