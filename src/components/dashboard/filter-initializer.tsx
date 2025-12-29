"use client"

// Composant qui initialise les filtres sur la dernière semaine avec données
// Redirige automatiquement si l'URL contient la semaine actuelle (default nuqs)
// mais que des données plus anciennes existent

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getISOWeek, getISOWeekYear } from "date-fns"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { serializeWeek, parseWeekString } from "@/lib/filters/parsers"

export function FilterInitializer() {
  const router = useRouter()
  const pathname = usePathname()
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
    // Only run once per mount
    if (hasInitialized.current) return

    // Wait for data to load
    if (latestWeek === undefined || !station) return

    // No data available - nothing to redirect to
    if (!latestWeek) {
      hasInitialized.current = true
      return
    }

    // Current week (what nuqs defaults to)
    const now = new Date()
    const currentWeek = { year: getISOWeekYear(now), week: getISOWeek(now) }

    // Week from URL
    const urlWeekStr = searchParams.get("week")
    const urlWeek = urlWeekStr ? parseWeekString(urlWeekStr) : null

    // Check if URL has the current week (nuqs default)
    const isCurrentWeekInUrl = urlWeek &&
      urlWeek.year === currentWeek.year &&
      urlWeek.week === currentWeek.week

    // Check if we have older data (latest data is before current week)
    const hasOlderData =
      latestWeek.year < currentWeek.year ||
      (latestWeek.year === currentWeek.year && latestWeek.week < currentWeek.week)

    // If URL shows current week but we have older data, redirect to latest data
    if (isCurrentWeekInUrl && hasOlderData) {
      hasInitialized.current = true

      // Build new URL preserving other params
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("period", "week")
      newParams.set("week", serializeWeek({ year: latestWeek.year, week: latestWeek.week }))

      router.replace(`${pathname}?${newParams.toString()}`)
    } else {
      // User explicitly chose a week or current week has data - don't redirect
      hasInitialized.current = true
    }
  }, [latestWeek, station, searchParams, router, pathname])

  // This component renders nothing
  return null
}
