"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StationSettings } from "@/components/settings/station-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { SubscriptionSettings } from "@/components/settings/subscription-settings"

export default function SettingsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="station" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="station">Station</TabsTrigger>
            <TabsTrigger value="compte">Compte</TabsTrigger>
            <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
          </TabsList>

          <TabsContent value="station">
            <StationSettings />
          </TabsContent>

          <TabsContent value="compte">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="abonnement">
            <SubscriptionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
