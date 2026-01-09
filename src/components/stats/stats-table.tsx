"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StatsTableData {
  weeks: { key: string; year: number; week: number }[];
  metrics: string[];
  data: Record<string, Record<string, string>>;
}

interface StatsTableProps {
  data: StatsTableData;
}

// Metrics that are percentages (to style differently)
const PERCENTAGE_METRICS = [
  "Livraison réussie (%)",
  "Livraison réussie (%) - DSP",
  "Pourcentage de livraisons réussies au premier jour",
  "Taux de réussite POD",
  "Colis retournés à l'agence (RTS) %",
  "Colis retournés à l'agence - Accès impossible %",
  "Colis retournés à l'agence - Client indisponible %",
  "Colis retournés à l'agence - Adresse de livraison introuvable %",
  "Colis retournés à l'agence - Aucun endroit sûr %",
  "Colis retournés à l'agence - Temps de transport insuffisant %",
  "Colis retournés à l'agence - Entreprise fermée %",
  "Colis retournés à l'agence - Autres %",
];

// Key metrics to highlight
const KEY_METRICS = [
  "Colis livrés",
  "Colis livrés non reçus (DNR)",
  "Livraison réussie (%)",
  "Livraison réussie (%) - DSP",
  "Taux de réussite POD",
];

function parsePercentage(value: string): number | null {
  const match = value.match(/([\d,]+(?:\.\d+)?)\s*%/);
  if (match) {
    return parseFloat(match[1].replace(",", "."));
  }
  return null;
}

function getPercentageColor(value: string): string {
  const percent = parsePercentage(value);
  if (percent === null) return "";

  if (percent >= 98) return "text-emerald-400";
  if (percent >= 95) return "text-blue-400";
  if (percent >= 90) return "text-amber-400";
  return "text-red-400";
}

export function StatsTable({ data }: StatsTableProps) {
  if (!data || data.weeks.length === 0 || data.metrics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[250px]">
                Métrique
              </TableHead>
              {data.weeks.map((week) => (
                <TableHead
                  key={week.key}
                  className="text-center min-w-[100px]"
                >
                  <div className="font-medium">S{week.week}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {week.year}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.metrics.map((metricName) => {
              const isPercentage = PERCENTAGE_METRICS.includes(metricName);
              const isKey = KEY_METRICS.includes(metricName);

              return (
                <TableRow
                  key={metricName}
                  className={cn(
                    isKey && "bg-primary/5",
                    "hover:bg-muted/50"
                  )}
                >
                  <TableCell
                    className={cn(
                      "sticky left-0 bg-background z-10 font-medium",
                      isKey && "bg-primary/5 text-primary"
                    )}
                  >
                    {metricName}
                  </TableCell>
                  {data.weeks.map((week) => {
                    const value = data.data[metricName]?.[week.key] || "-";
                    const percentColor = isPercentage
                      ? getPercentageColor(value)
                      : "";

                    return (
                      <TableCell
                        key={week.key}
                        className={cn(
                          "text-center tabular-nums",
                          percentColor,
                          isKey && "font-medium"
                        )}
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
