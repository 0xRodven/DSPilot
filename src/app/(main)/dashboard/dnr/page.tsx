"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { PackageX } from "lucide-react";

import { DnrDetailSheet } from "@/components/dnr/dnr-detail-sheet";
import { DnrKpis } from "@/components/dnr/dnr-kpis";
import { DnrSparkline } from "@/components/dnr/dnr-sparkline";
import type { DnrRow } from "@/components/dnr/dnr-table/columns";
import { columns } from "@/components/dnr/dnr-table/columns";
import { DnrDataTable } from "@/components/dnr/dnr-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";

export default function DnrPage() {
  const { selectedStation } = useDashboardStore();
  const { year, weekNum, driver } = useFilters();
  const [selectedInvestigation, setSelectedInvestigation] = useState<DnrRow | null>(null);

  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  const driverFilter = driver || undefined;

  const investigations = useQuery(
    api.dnr.getInvestigations,
    station
      ? {
          stationId: station._id,
          year,
          week: weekNum,
          ...(driverFilter ? { driverId: driverFilter as Id<"drivers"> } : {}),
        }
      : "skip",
  );

  if (!station || investigations === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="flex items-center gap-2 font-bold text-2xl">
              <PackageX className="h-6 w-6" />
              Investigations DNR
            </h1>
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[60px]" />
          <Skeleton className="h-64" />
        </div>
      </main>
    );
  }

  // Cast Convex docs to DnrRow for the table
  const rows: DnrRow[] = investigations.map((inv) => ({
    _id: inv._id,
    trackingId: inv.trackingId,
    driverId: inv.driverId ?? undefined,
    transporterId: inv.transporterId,
    driverName: inv.driverName,
    deliveryDatetime: inv.deliveryDatetime,
    concessionDatetime: inv.concessionDatetime,
    scanType: inv.scanType,
    address: inv.address,
    gpsPlanned: inv.gpsPlanned ?? undefined,
    gpsActual: inv.gpsActual ?? undefined,
    gpsDistanceMeters: inv.gpsDistanceMeters ?? undefined,
    customerNotes: inv.customerNotes ?? undefined,
    status: inv.status,
  }));

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl text-foreground">
            <PackageX className="h-6 w-6" />
            Investigations DNR
          </h1>
          <p className="text-muted-foreground text-sm">
            Suivi des réclamations &quot;Did Not Receive&quot; — Semaine {weekNum}
          </p>
        </div>

        <DnrKpis stationId={station._id} year={year} week={weekNum} />

        <DnrSparkline stationId={station._id} year={year} week={weekNum} />

        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <PackageX className="mb-2 h-8 w-8" />
            <p>Aucune investigation DNR cette semaine</p>
          </div>
        ) : (
          <DnrDataTable columns={columns} data={rows} onRowClick={setSelectedInvestigation} />
        )}

        <DnrDetailSheet
          investigation={selectedInvestigation}
          open={selectedInvestigation !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedInvestigation(null);
          }}
        />
      </div>
    </main>
  );
}
