"use client";

import { useEffect } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/lib/store";

export function StationSelector() {
  const { selectedStation, setSelectedStation } = useDashboardStore();

  // Load stations from Convex
  const stations = useQuery(api.stations.listUserStations);
  const isLoadingStations = stations === undefined;

  // Auto-select first station when loaded and no station is selected
  useEffect(() => {
    if (stations && stations.length > 0 && !selectedStation.id) {
      const first = stations[0];
      setSelectedStation({
        id: first._id,
        name: first.name,
        code: first.code,
      });
    }
  }, [stations, selectedStation.id, setSelectedStation]);

  if (isLoadingStations) {
    return <Skeleton className="h-9 w-[100px] md:w-[180px]" />;
  }

  if (!stations || stations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-auto border-dashed text-xs md:text-sm"
        onClick={() => (window.location.href = "/dashboard/import")}
      >
        <Building2 className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Importer une station</span>
        <span className="sm:hidden">Import</span>
      </Button>
    );
  }

  return (
    <Select
      value={selectedStation.id}
      onValueChange={(value) => {
        const station = stations.find((s) => s._id === value);
        if (station) {
          setSelectedStation({
            id: station._id,
            name: station.name,
            code: station.code,
          });
        }
      }}
    >
      <SelectTrigger className="h-9 w-[100px] border-border bg-card text-card-foreground md:w-[180px]">
        <SelectValue>
          {selectedStation.code ? (
            <>
              <span className="font-medium">{selectedStation.code}</span>
              <span className="ml-2 hidden text-muted-foreground md:inline">- {selectedStation.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Station</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
        {stations.map((station) => (
          <SelectItem key={station._id} value={station._id}>
            <span className="font-medium">{station.code}</span> - {station.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
