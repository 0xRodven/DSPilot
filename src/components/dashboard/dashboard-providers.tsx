"use client";

// Client-side providers et initializers pour le dashboard

import { ChatWidget } from "@/components/chat/chat-widget";

import { FilterInitializer } from "./filter-initializer";
import { OrgStationSync } from "./org-station-sync";

interface DashboardProvidersProps {
  children: React.ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <>
      <OrgStationSync />
      <FilterInitializer />
      {children}
      <ChatWidget />
    </>
  );
}
