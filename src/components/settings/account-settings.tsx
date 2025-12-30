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
      {/* Profil via Clerk */}
      <Card>
        <CardHeader>
          <CardTitle>Votre profil</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-0",
                navbar: "hidden",
                pageScrollBox: "p-4",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
            routing="hash"
          />
        </CardContent>
      </Card>

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
