"use client"

import { OrganizationProfile, useOrganization } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TeamSettings() {
  const { organization } = useOrganization()

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion de l&apos;équipe
          </CardTitle>
          <CardDescription>
            Invitez et gérez les membres de votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Organisation requise</AlertTitle>
            <AlertDescription>
              Créez d&apos;abord une organisation via le menu en haut à gauche pour gérer votre équipe.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Équipe - {organization.name}
        </CardTitle>
        <CardDescription>
          Invitez des managers et viewers pour accéder aux données de cette station
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-card overflow-hidden">
          <OrganizationProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-0",
                navbar: "hidden",
                pageScrollBox: "p-0",
              },
            }}
            routing="hash"
          />
        </div>
      </CardContent>
    </Card>
  )
}
