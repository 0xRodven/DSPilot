import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { UserButton } from "@clerk/nextjs";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";

import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";
import { DashboardProviders } from "@/components/dashboard/dashboard-providers";
import { HeaderOrgSwitcher } from "@/components/dashboard/header-org-switcher";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { AlertsDropdown } from "@/components/alerts/alerts-dropdown";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardProviders>
        <AppSidebar variant={variant} collapsible={collapsible} />
        <SidebarInset
          className={cn(
            "[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!",
            "max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!",
          )}
        >
          <header
            className={cn(
              "flex flex-col md:flex-row min-h-12 shrink-0 items-stretch md:items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12",
              "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
            )}
          >
            {/* Desktop: single row layout */}
            <div className="hidden md:flex w-full items-center justify-between px-4 lg:px-6 h-12">
              {/* Left section */}
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>

              {/* Center section - DSPilot specific */}
              <div className="flex items-center gap-2">
                <HeaderOrgSwitcher />
                <PeriodPicker />
              </div>

              {/* Right section */}
              <div className="flex items-center gap-2">
                <AlertsDropdown />
                <LayoutControls />
                <ThemeSwitcher />
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </div>

            {/* Mobile: two row layout */}
            <div className="flex md:hidden flex-col gap-2 px-3 py-2">
              {/* Row 1: Sidebar trigger, search, user controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <SearchDialog />
                </div>
                <div className="flex items-center gap-1">
                  <AlertsDropdown />
                  <ThemeSwitcher />
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-7 w-7",
                      },
                    }}
                  />
                </div>
              </div>
              {/* Row 2: Station and period picker */}
              <div className="flex items-center gap-2">
                <HeaderOrgSwitcher />
                <PeriodPicker />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </DashboardProviders>
    </SidebarProvider>
  );
}
