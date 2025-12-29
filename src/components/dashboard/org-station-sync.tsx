"use client"

import { useEffect } from "react"
import { useOrganization } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"

/**
 * Synchronise l'organisation Clerk avec la station Convex
 * Architecture 1 Org = 1 Station
 *
 * Ce composant doit être rendu dans le layout pour que la synchro soit active.
 * Il met à jour automatiquement selectedStation dans le store Zustand
 * quand l'utilisateur change d'organisation.
 */
export function OrgStationSync() {
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const setSelectedStation = useDashboardStore((s) => s.setSelectedStation)

  // Query la station de l'org courante
  const station = useQuery(api.stations.getStationForCurrentOrg)

  // Sync station quand elle change
  useEffect(() => {
    if (!orgLoaded) return

    if (station) {
      // Station trouvée pour cette org -> mettre à jour le store
      setSelectedStation({
        id: station._id,
        name: station.name,
        code: station.code,
      })
    } else if (organization) {
      // Org sélectionnée mais pas de station -> reset
      setSelectedStation({
        id: "",
        name: organization.name,
        code: "",
      })
    } else {
      // Pas d'org -> reset complet
      setSelectedStation({
        id: "",
        name: "",
        code: "",
      })
    }
  }, [station, organization, orgLoaded, setSelectedStation])

  // Ce composant ne rend rien
  return null
}
