"use client"

// Client-side providers et initializers pour le dashboard

import { FilterInitializer } from "./filter-initializer"

interface DashboardProvidersProps {
  children: React.ReactNode
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <>
      <FilterInitializer />
      {children}
    </>
  )
}
