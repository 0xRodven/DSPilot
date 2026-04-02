import type { ReactNode } from "react";

import { Inter } from "next/font/google";

import { frFR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/ui/sonner";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DSPilot - Dashboard",
  description: "Tableau de bord de gestion des performances des drivers Amazon",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible } =
    PREFERENCE_DEFAULTS;
  return (
    <ClerkProvider localization={frFR} appearance={clerkAppearance}>
      <html
        lang="fr"
        className={theme_mode}
        data-theme-preset={theme_preset}
        data-content-layout={content_layout}
        data-navbar-style={navbar_style}
        data-sidebar-variant={sidebar_variant}
        data-sidebar-collapsible={sidebar_collapsible}
        suppressHydrationWarning
      >
        <head>
          {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
          <ThemeBootScript />
        </head>
        <body className={`${inter.className} min-h-screen antialiased`}>
          <NuqsAdapter>
            <ConvexClientProvider>
              <PreferencesStoreProvider
                themeMode={theme_mode}
                themePreset={theme_preset}
                contentLayout={content_layout}
                navbarStyle={navbar_style}
              >
                {children}
                <Toaster />
              </PreferencesStoreProvider>
            </ConvexClientProvider>
          </NuqsAdapter>
        </body>
      </html>
    </ClerkProvider>
  );
}
