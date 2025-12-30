"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationSettings } from "@/components/settings/organization-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { SubscriptionSettings } from "@/components/settings/subscription-settings"
import { WhatsappSettings } from "@/components/settings/whatsapp-settings"

export default function SettingsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organisation" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="organisation">Organisation</TabsTrigger>
            <TabsTrigger value="compte">Compte</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
          </TabsList>

          <TabsContent value="organisation">
            <OrganizationSettings />
          </TabsContent>

          <TabsContent value="compte">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsappSettings />
          </TabsContent>

          <TabsContent value="abonnement">
            <SubscriptionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
