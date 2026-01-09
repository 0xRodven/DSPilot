"use client";

import { useCallback } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useDashboardStore } from "@/lib/store";
import { BarChart3, Database, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

import { StatsDropzone } from "@/components/stats/stats-dropzone";
import { StatsTable } from "@/components/stats/stats-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeliveryMetricData } from "@/lib/parser/delivery-overview-csv";

export default function StatsPage() {
  const { organization } = useOrganization();
  const { selectedStation } = useDashboardStore();

  // Check if station is properly selected (not empty string)
  const hasValidStation = selectedStation?.id && selectedStation.id.length > 0;

  // Query for existing stats
  const statsData = useQuery(
    api.stationDeliveryStats.getDeliveryStatsByStation,
    hasValidStation ? { stationId: selectedStation.id as Id<"stations"> } : "skip"
  );

  // Mutations
  const bulkUpsert = useMutation(api.stationDeliveryStats.bulkUpsertDeliveryStats);
  const deleteAll = useMutation(api.stationDeliveryStats.deleteAllDeliveryStats);

  // Handle import
  const handleImport = useCallback(
    async (metrics: DeliveryMetricData[]) => {
      if (!selectedStation?.id) {
        throw new Error("Aucune station sélectionnée");
      }

      const result = await bulkUpsert({
        stationId: selectedStation.id as Id<"stations">,
        stats: metrics.map((m) => ({
          metricName: m.metricName,
          year: m.year,
          week: m.week,
          value: m.value,
          numericValue: m.numericValue,
        })),
      });

      toast.success(
        `${result.inserted} nouvelles entrées, ${result.updated} mises à jour`
      );
    },
    [selectedStation, bulkUpsert]
  );

  // Handle delete all
  const handleDeleteAll = useCallback(async () => {
    if (!selectedStation?.id) return;

    if (!confirm("Supprimer toutes les statistiques ? Cette action est irréversible.")) {
      return;
    }

    const result = await deleteAll({ stationId: selectedStation.id as Id<"stations"> });
    toast.success(`${result.deleted} entrées supprimées`);
  }, [selectedStation, deleteAll]);

  // Loading state
  if (!hasValidStation || statsData === undefined) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const hasData = statsData && statsData.weeks.length > 0;
  const orgName = organization?.name || selectedStation.name;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{orgName} Stats</h1>
            <p className="text-sm text-muted-foreground">
              Statistiques Delivery Overview par semaine
            </p>
          </div>
        </div>
        {hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        )}
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import CSV</CardTitle>
          <CardDescription>
            Importez votre fichier CSV "DSP_Delivery_Overview" pour ajouter les statistiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsDropzone onImport={handleImport} />
        </CardContent>
      </Card>

      {/* Stats Table */}
      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Statistiques ({statsData.weeks.length} semaine
              {statsData.weeks.length > 1 ? "s" : ""})
            </CardTitle>
            <CardDescription>
              {statsData.metrics.length} métriques importées
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <StatsTable data={statsData} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucune donnée</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Importez un fichier CSV "Delivery Overview" pour commencer à suivre vos
              statistiques de livraison.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
