"use client";

import { startTransition, useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { PackageX } from "lucide-react";

import { DnrDailyChart } from "@/components/dnr/dnr-daily-chart";
import { DnrDetailSheet } from "@/components/dnr/dnr-detail-sheet";
import { DnrKpis } from "@/components/dnr/dnr-kpis";
import type { DnrRow } from "@/components/dnr/dnr-table/columns";
import { columns } from "@/components/dnr/dnr-table/columns";
import { DnrDataTable } from "@/components/dnr/dnr-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function formatDayLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return `${DAYS_FR[d.getDay()]} ${format(d, "d MMMM", { locale: fr })}`;
  } catch {
    return dateStr;
  }
}

export default function DnrPage() {
  const { selectedStation } = useDashboardStore();
  const { year, weekNum, driver } = useFilters();
  const [selectedInvestigation, setSelectedInvestigation] = useState<DnrRow | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
              DNR & Investigations
            </h1>
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[180px]" />
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
    entryType: (inv.entryType as "concession" | "investigation" | undefined) ?? "concession",
    investigationReason: inv.investigationReason ?? undefined,
    investigationDate: inv.investigationDate ?? undefined,
    investigationVerdict: inv.investigationVerdict ?? undefined,
    status: inv.status,
  }));

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl text-foreground">
            <PackageX className="h-6 w-6" />
            DNR & Investigations
          </h1>
          <p className="text-muted-foreground text-sm">
            Semaine {weekNum}
            {selectedDay && <span className="ml-1 font-medium text-foreground">— {formatDayLabel(selectedDay)}</span>}
          </p>
        </div>

        <DnrKpis stationId={station._id} year={year} week={weekNum} />

        <DnrDailyChart
          data={rows}
          selectedDay={selectedDay}
          onDayClick={(day) => startTransition(() => setSelectedDay(day))}
        />

        {selectedDay && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{formatDayLabel(selectedDay)}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">
              {
                rows.filter((r) => {
                  const d = r.concessionDatetime?.split(" ")[0] ?? r.concessionDatetime?.split("T")[0];
                  return d === selectedDay;
                }).length
              }{" "}
              entrée(s)
            </span>
            <button
              type="button"
              className="ml-2 rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground"
              onClick={() => startTransition(() => setSelectedDay(null))}
            >
              Tout afficher
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <PackageX className="mb-2 h-8 w-8" />
            <p>Aucun DNR ni investigation cette semaine</p>
          </div>
        ) : (
          <DnrDataTable columns={columns} data={rows} onRowClick={setSelectedInvestigation} selectedDay={selectedDay} />
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
