import { getMetricDefinition, type MetricKey } from "./catalogue";

export type MetricProvenance = {
  metric: MetricKey;
  sourceLabel: string;
  cadenceLabel: string;
  verificationLabel: string;
  derivedLabel: string;
  summary: string;
};

function formatCadence(metric: MetricKey): string {
  const definition = getMetricDefinition(metric);
  switch (definition.granularity) {
    case "daily":
      return "Mise a jour quotidienne";
    case "weekly":
      return "Mise a jour hebdomadaire";
    case "rolling":
      return "Calcule sur la periode selectionnee";
    case "snapshot":
      return "Photo ponctuelle";
    default:
      return "Cadence non specifiee";
  }
}

function formatVerification(metric: MetricKey): string {
  const definition = getMetricDefinition(metric);
  switch (definition.sourceFieldStatus) {
    case "verified":
      return "Champ source verifie";
    case "inferred":
      return "Champ source infere";
    case "needs_verification":
      return "Champ source a verifier";
    default:
      return "Verification non specifiee";
  }
}

function formatDerived(metric: MetricKey): string {
  const definition = getMetricDefinition(metric);
  return definition.derived ? "Metrique derivee DSPilot" : "Metrique brute Amazon";
}

export function getMetricProvenance(metric: MetricKey): MetricProvenance {
  const definition = getMetricDefinition(metric);

  return {
    metric,
    sourceLabel: definition.sourceReport,
    cadenceLabel: formatCadence(metric),
    verificationLabel: formatVerification(metric),
    derivedLabel: formatDerived(metric),
    summary: `${definition.shortLabel} - ${definition.sourceReport} - ${formatDerived(metric)}`,
  };
}

export function getMetricTooltipLines(metric: MetricKey): string[] {
  const definition = getMetricDefinition(metric);
  const provenance = getMetricProvenance(metric);

  const lines = [
    definition.description,
    `Source: ${provenance.sourceLabel}`,
    `Cadence: ${provenance.cadenceLabel}`,
    `Nature: ${provenance.derivedLabel}`,
    `Verification: ${provenance.verificationLabel}`,
  ];

  if (definition.formula) {
    lines.push(`Formule: ${definition.formula}`);
  }

  lines.push(`Pourquoi c'est important: ${definition.businessWhy}`);

  if (definition.recommendedAction) {
    lines.push(`Action manager: ${definition.recommendedAction}`);
  }

  return lines;
}
