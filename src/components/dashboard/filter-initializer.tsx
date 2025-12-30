"use client"

// Composant qui initialise les filtres sur la dernière semaine avec données
// Redirige automatiquement si l'URL contient la semaine actuelle (default nuqs)
// mais que des données plus anciennes existent

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getISOWeek, getISOWeekYear } from "date-fns"
import { api } from "@convex/_generated/api"
import { serializeWeek, parseWeekString } from "@/lib/filters/parsers"

export function FilterInitializer() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasInitialized = useRef(false)

  // Get station for current org (1 org = 1 station architecture)
  const station = useQuery(api.stations.getStationForCurrentOrg)

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

    // Current week (what nuqs defaults to when no param)
    const now = new Date()
    const currentWeek = { year: getISOWeekYear(now), week: getISOWeek(now) }

    // Week from URL (null if not present)
    const urlWeekStr = searchParams.get("week")
    const urlWeek = urlWeekStr ? parseWeekString(urlWeekStr) : null

    // If no week param, nuqs will default to current week - treat same as current week
    const isDefaultWeek = !urlWeek || (
      urlWeek.year === currentWeek.year &&
      urlWeek.week === currentWeek.week
    )

    // Check if we have data that differs from current week
    const latestIsDifferent =
      latestWeek.year !== currentWeek.year ||
      latestWeek.week !== currentWeek.week

    // If using default week but we have data from a different week, redirect to latest data
    if (isDefaultWeek && latestIsDifferent) {
      hasInitialized.current = true

      // Build new URL preserving other params
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("period", "week")
      newParams.set("week", serializeWeek({ year: latestWeek.year, week: latestWeek.week }))

      router.replace(`${pathname}?${newParams.toString()}`)
    } else {
      // User explicitly chose a specific week OR latest data is current week - don't redirect
      hasInitialized.current = true
    }
  }, [latestWeek, station, searchParams, router, pathname])

  // This component renders nothing
  return null
}
