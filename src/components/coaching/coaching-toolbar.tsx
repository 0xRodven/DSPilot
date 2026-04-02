"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CoachingStats {
  pending: { count: number; overdueCount: number };
  improved: { count: number; avgImprovement: number };
  noEffect: { count: number };
  escalated: { count: number };
  total: number;
  thisMonth: number;
}

interface CoachingToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  periodFilter: string;
  onPeriodFilterChange: (period: string) => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  onNewAction: () => void;
  stats: CoachingStats;
}

const statusTabs = [
  { id: null, label: "Tous", color: "text-white" },
  { id: "pending", label: "En attente", color: "text-amber-400" },
  { id: "improved", label: "Améliorés", color: "text-emerald-400" },
  { id: "no_effect", label: "Sans effet", color: "text-zinc-400" },
  { id: "escalated", label: "Escaladés", color: "text-red-400" },
];

export function CoachingToolbar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  periodFilter,
  onPeriodFilterChange,
  statusFilter,
  onStatusFilterChange,
  onNewAction,
  stats,
}: CoachingToolbarProps) {
  const getCount = (status: string | null) => {
    if (status === null) return stats.total;
    if (status === "pending") return stats.pending.count;
    if (status === "improved") return stats.improved.count;
    if (status === "no_effect") return stats.noEffect.count;
    if (status === "escalated") return stats.escalated.count;
    return 0;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Search, Filters, New Button */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Rechercher un driver..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-zinc-800 bg-zinc-900/50 pl-10 text-white placeholder:text-zinc-500"
          />
        </div>

        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-40 border-zinc-800 bg-zinc-900/50 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900">
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="discussion">Discussion</SelectItem>
            <SelectItem value="warning">Avertissement</SelectItem>
            <SelectItem value="training">Formation</SelectItem>
            <SelectItem value="suspension">Suspension</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
          <SelectTrigger className="w-36 border-zinc-800 bg-zinc-900/50 text-white">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900">
            <SelectItem value="1m">Ce mois</SelectItem>
            <SelectItem value="3m">3 mois</SelectItem>
            <SelectItem value="6m">6 mois</SelectItem>
            <SelectItem value="all">Tout</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onNewAction} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle action
        </Button>
      </div>

      {/* Row 2: Status Tabs */}
      <div className="flex items-center gap-2 border-zinc-800 border-b pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.id ?? "all"}
            onClick={() => onStatusFilterChange(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors",
              statusFilter === tab.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
            )}
          >
            <span className={tab.color}>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                statusFilter === tab.id ? "bg-zinc-700" : "bg-zinc-800",
              )}
            >
              {getCount(tab.id)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
