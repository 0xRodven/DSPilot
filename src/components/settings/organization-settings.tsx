"use client"

import { OrganizationProfile, useOrganization } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Building2, Calendar } from "lucide-react"

export function OrganizationSettings() {
  const { organization, isLoaded } = useOrganization()
  const station = useQuery(api.stations.getStationForCurrentOrg)

  if (!isLoaded) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Aucune organisation sélectionnée.</p>
          <p className="text-sm mt-2">Créez ou rejoignez une organisation pour commencer.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Infos Station */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>{organization.name}</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {station?.plan || "Free"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {station?.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Créée le {format(station.createdAt, "d MMMM yyyy", { locale: fr })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestion Équipe via Clerk */}
      <Card>
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrganizationProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-0 bg-card",
                card: "bg-card",
                navbar: "hidden",
                pageScrollBox: "p-4 bg-card",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                // Table & member list styling
                tableHead: "text-muted-foreground border-b border-border bg-muted/30",
                tableBodyRow: "border-b border-border hover:bg-accent/50",
                // Form elements
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                formFieldInput: "bg-background border-input text-foreground",
                formFieldLabel: "text-foreground",
                // Badges
                badge: "bg-muted text-muted-foreground",
                // Profile section
                profileSectionContent: "bg-card [&_*]:text-foreground",
                profileSectionPrimaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
                // Members section
                membersPageInviteButton: "bg-primary text-primary-foreground hover:bg-primary/90",
              },
            }}
            routing="hash"
          />
        </CardContent>
      </Card>
    </div>
  )
}
