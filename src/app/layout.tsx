import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { ClerkProvider } from "@clerk/nextjs"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { ConvexClientProvider } from "@/providers/convex-client-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DSPilot - Dashboard",
  description: "Tableau de bord de gestion des performances des drivers",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
}

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="fr" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <NuqsAdapter>
            <ConvexClientProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                {children}
                <Toaster richColors position="bottom-right" />
              </ThemeProvider>
            </ConvexClientProvider>
          </NuqsAdapter>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
