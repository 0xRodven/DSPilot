"use client"

import { UserProfile } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function AccountSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      {/* Profil via Clerk - Full width */}
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none border border-border rounded-lg bg-card",
            card: "bg-card",
            pageScrollBox: "p-4 bg-card",
            // Profile section
            profileSectionContent: "bg-card [&_*]:text-foreground",
            profileSectionPrimaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",
            // Form elements
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
            formFieldInput: "bg-background border-input text-foreground",
            formFieldLabel: "text-foreground",
            // Badges
            badge: "bg-muted text-muted-foreground",
          },
        }}
        routing="hash"
      />

      {/* Thème */}
      <Card>
        <CardHeader>
          <CardTitle>Thème</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              className="flex items-center gap-2"
            >
              <Sun className="h-4 w-4" />
              Clair
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="flex items-center gap-2"
            >
              <Moon className="h-4 w-4" />
              Sombre
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              Système
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
