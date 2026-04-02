"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Upload,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Navigation items based on sidebar-items.ts
const navigationItems = [
  { group: "Principal", icon: LayoutDashboard, label: "Dashboard", url: "/dashboard" },
  { group: "Principal", icon: Users, label: "Drivers", url: "/dashboard/drivers" },
  { group: "Principal", icon: AlertTriangle, label: "Erreurs", url: "/dashboard/errors" },
  { group: "Principal", icon: Upload, label: "Import", url: "/dashboard/import" },
  { group: "Coaching", icon: ClipboardList, label: "Planification", url: "/dashboard/coaching" },
  { group: "Coaching", icon: Calendar, label: "Calendrier", url: "/dashboard/coaching/calendar" },
  { group: "Coaching", icon: MessageSquare, label: "Récapitulatifs", url: "/dashboard/coaching/recaps" },
  { group: "Configuration", icon: Settings, label: "Paramètres", url: "/dashboard/settings" },
];

// Error types for search
const errorTypes = [
  { code: "contactMiss", label: "Contact manqué", category: "DWC", tab: "dwc" },
  { code: "photoDefect", label: "Photo défectueuse", category: "DWC", tab: "dwc" },
  { code: "noPhoto", label: "Pas de photo", category: "DWC", tab: "dwc" },
  { code: "otpMiss", label: "OTP manqué", category: "DWC", tab: "dwc" },
  { code: "mailbox", label: "Boîte aux lettres", category: "IADC", tab: "iadc" },
  { code: "unattended", label: "Sans surveillance", category: "IADC", tab: "iadc" },
  { code: "safePlace", label: "Lieu sûr", category: "IADC", tab: "iadc" },
];

// Quick actions
const quickActions = [
  { id: "new-coaching", icon: Plus, label: "Nouvelle action coaching", action: "coaching" },
  { id: "at-risk", icon: AlertTriangle, label: "Conducteurs à risque (Poor)", url: "/dashboard/drivers?tier=poor" },
  { id: "great-plus", icon: Users, label: "Conducteurs Great+", url: "/dashboard/drivers?tier=great" },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const router = useRouter();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcut (Cmd+J)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Query station for current org (1 Org = 1 Station architecture)
  const station = useQuery(api.stations.getStationForCurrentOrg);

  // Search drivers query
  const drivers = useQuery(
    api.drivers.searchDriversByName,
    station && debouncedSearch.length >= 2 ? { stationId: station._id, name: debouncedSearch, limit: 5 } : "skip",
  );

  // Filter error types based on search
  const filteredErrors = React.useMemo(() => {
    if (debouncedSearch.length < 2) return [];
    const searchLower = debouncedSearch.toLowerCase();
    return errorTypes.filter(
      (e) =>
        e.code.toLowerCase().includes(searchLower) ||
        e.label.toLowerCase().includes(searchLower) ||
        e.category.toLowerCase().includes(searchLower),
    );
  }, [debouncedSearch]);

  // Filter quick actions based on search
  const filteredQuickActions = React.useMemo(() => {
    if (!debouncedSearch) return quickActions;
    const searchLower = debouncedSearch.toLowerCase();
    return quickActions.filter((a) => a.label.toLowerCase().includes(searchLower));
  }, [debouncedSearch]);

  // Navigation handler
  const handleNavigate = (url: string) => {
    router.push(url);
    setOpen(false);
    setSearch("");
  };

  // Driver selection handler
  const handleDriverSelect = (driverId: string) => {
    router.push(`/dashboard/drivers/${driverId}`);
    setOpen(false);
    setSearch("");
  };

  // Error selection handler
  const handleErrorSelect = (tab: string) => {
    router.push(`/dashboard/errors?tab=${tab}`);
    setOpen(false);
    setSearch("");
  };

  // Quick action handler
  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if (action.url) {
      router.push(action.url);
    }
    // For "new-coaching", emit a custom event that the parent can listen to
    if (action.action === "coaching") {
      window.dispatchEvent(new CustomEvent("dspilot:open-coaching-modal"));
    }
    setOpen(false);
    setSearch("");
  };

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  // Group and filter navigation items
  const navGroups = React.useMemo(() => {
    const groups = new Map<string, typeof navigationItems>();
    const searchLower = debouncedSearch.toLowerCase();

    for (const item of navigationItems) {
      // Filter by search term if searching
      if (searchLower && !item.label.toLowerCase().includes(searchLower)) {
        continue;
      }
      const existing = groups.get(item.group) || [];
      groups.set(item.group, [...existing, item]);
    }
    return groups;
  }, [debouncedSearch]);

  const isSearching = debouncedSearch.length >= 2;
  const isLoadingDrivers = isSearching && station && drivers === undefined;

  // Check if there are any results to show
  const hasNavResults = navGroups.size > 0;
  const hasDriverResults = drivers && drivers.length > 0;
  const hasErrorResults = filteredErrors.length > 0;
  const hasQuickActionResults = filteredQuickActions.length > 0;
  const hasAnyResults = hasNavResults || hasDriverResults || hasErrorResults || hasQuickActionResults;

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Rechercher
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Rechercher pages, conducteurs, erreurs..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {/* Empty state - only show when searching and no results */}
          {isSearching && !isLoadingDrivers && !hasAnyResults && (
            <div className="py-6 text-center text-muted-foreground text-sm">Aucun résultat trouvé.</div>
          )}

          {/* Loading state */}
          {isLoadingDrivers && (
            <div className="py-6 text-center text-muted-foreground text-sm">Recherche en cours...</div>
          )}

          {/* Navigation Groups */}
          {Array.from(navGroups).map(([group, items], index) => (
            <React.Fragment key={group}>
              {index !== 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <CommandItem key={item.url} className="!py-1.5" onSelect={() => handleNavigate(item.url)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}

          {/* Drivers Search Results */}
          {isSearching && drivers && drivers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Conducteurs">
                {drivers.map((driver) => (
                  <CommandItem key={driver._id} className="!py-1.5" onSelect={() => handleDriverSelect(driver._id)}>
                    <User className="mr-2 h-4 w-4" />
                    <span className="flex-1">{driver.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{driver.amazonId}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Error Types Search Results */}
          {filteredErrors.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Types d'erreurs">
                {filteredErrors.map((error) => (
                  <CommandItem key={error.code} className="!py-1.5" onSelect={() => handleErrorSelect(error.tab)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span className="flex-1">{error.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {error.category}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions rapides">
                {filteredQuickActions.map((action) => (
                  <CommandItem key={action.id} className="!py-1.5" onSelect={() => handleQuickAction(action)}>
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
