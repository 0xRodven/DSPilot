"use client";

import { useMemo } from "react";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { useBuildFilteredHref } from "@/lib/filters";

import { createColumns, type DriversListDriver } from "./columns";
import { DataTable } from "./data-table";

interface TierStat {
  count: number;
  percentage: string;
  trend: number;
}

interface TierStats {
  fantastic: TierStat;
  great: TierStat;
  fair: TierStat;
  poor: TierStat;
  total: number;
  active: number;
}

interface Driver {
  id: string;
  name: string;
  amazonId: string;
  dwcPercent: number;
  iadcPercent: number;
  daysActive: number;
  tier: "fantastic" | "great" | "fair" | "poor";
  trend: number | null;
  dnrCount?: number;
}

interface DriversListTableProps {
  drivers: Driver[];
  stats: TierStats;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  periodMode?: "week" | "day";
}

export function DriversListTable({
  drivers,
  stats,
  selectedTier,
  onTierChange,
  periodMode = "week",
}: DriversListTableProps) {
  const router = useRouter();
  const buildHref = useBuildFilteredHref();

  // Transform data for the table
  const tableData: DriversListDriver[] = useMemo(() => {
    return drivers.map((d) => ({
      id: d.id,
      name: d.name,
      amazonId: d.amazonId,
      dwcPercent: d.dwcPercent,
      iadcPercent: d.iadcPercent,
      daysActive: d.daysActive,
      tier: d.tier,
      trend: d.trend,
      dnrCount: d.dnrCount,
    }));
  }, [drivers]);

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      createColumns({
        onViewDriver: (driverId) => router.push(buildHref(`/dashboard/drivers/${driverId}`)),
        onPlanCoaching: (driverId) => router.push(buildHref(`/dashboard/coaching?driverId=${driverId}`)),
        onDnrClick: (driverId) => router.push(`${buildHref(`/dashboard/dnr`)}&driver=${driverId}`),
        periodMode,
      }),
    [router, buildHref, periodMode],
  );

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <DataTable
          columns={columns}
          data={tableData}
          stats={stats}
          selectedTier={selectedTier}
          onTierChange={onTierChange}
          periodMode={periodMode}
          onRowClick={(driverId) => router.push(buildHref(`/dashboard/drivers/${driverId}`))}
        />
      </CardContent>
    </Card>
  );
}
