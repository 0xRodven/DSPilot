"use client"

// Composant qui initialise les filtres sur la dernière semaine avec données
// S'exécute une seule fois au premier chargement du dashboard

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { serializeWeek } from "@/lib/filters/parsers"

const INIT_FLAG_KEY = "dspilot-filter-initialized"

export function FilterInitializer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedStation } = useDashboardStore()
  const hasInitialized = useRef(false)

  // Get station from Convex
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Get latest week with data
  const latestWeek = useQuery(
    api.stats.getLatestWeekWithData,
    station ? { stationId: station._id } : "skip"
  )

  useEffect(() => {
    // Only run once
    if (hasInitialized.current) return

    // Wait for data
    if (latestWeek === undefined || !station) return

    // Check if URL already has explicit week parameter
    const hasExplicitWeek = searchParams.has("week")

    // Check if we've already initialized this session
    const alreadyInitialized = sessionStorage.getItem(INIT_FLAG_KEY)

    // If no explicit week in URL and not yet initialized, redirect to latest week
    if (!hasExplicitWeek && !alreadyInitialized && latestWeek) {
      hasInitialized.current = true
      sessionStorage.setItem(INIT_FLAG_KEY, "true")

      // Build new URL with latest week
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("period", "week")
      newParams.set("week", serializeWeek({ year: latestWeek.year, week: latestWeek.week }))

      // Navigate to the new URL
      const currentPath = window.location.pathname
      router.replace(`${currentPath}?${newParams.toString()}`)
    } else {
      // Mark as initialized even if we didn't redirect
      hasInitialized.current = true
      if (!alreadyInitialized) {
        sessionStorage.setItem(INIT_FLAG_KEY, "true")
      }
    }
  }, [latestWeek, station, searchParams, router])

  // This component renders nothing
  return null
}
