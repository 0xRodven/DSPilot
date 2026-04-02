"use client";

import { OrganizationProfile, useOrganization } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationSettings() {
  const { organization, isLoaded } = useOrganization();
  const station = useQuery(api.stations.getStationForCurrentOrg);

  if (!isLoaded) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Aucune organisation sélectionnée.</p>
          <p className="mt-2 text-sm">Créez ou rejoignez une organisation pour commencer.</p>
        </CardContent>
      </Card>
    );
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
        <CardContent className="space-y-2 text-muted-foreground text-sm">
          {station?.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Créée le {format(station.createdAt, "d MMMM yyyy", { locale: fr })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestion Équipe via Clerk - Full width */}
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none border border-border rounded-lg bg-card",
            card: "bg-card",
            pageScrollBox: "p-4 bg-card",
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
    </div>
  );
}
