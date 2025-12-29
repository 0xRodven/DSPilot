"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/store"
import { useBuildFilteredHref } from "@/lib/filters"
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  GraduationCap,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Drivers", href: "/dashboard/drivers" },
  { icon: AlertTriangle, label: "Erreurs", href: "/dashboard/errors" },
  { icon: GraduationCap, label: "Coaching", href: "/dashboard/coaching" },
  { icon: Upload, label: "Import", href: "/dashboard/import" },
]

const bottomNavItems = [{ icon: Settings, label: "Paramètres", href: "/dashboard/settings" }]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore()
  const buildHref = useBuildFilteredHref()

  // Navigation handler that preserves filter params
  const handleNavigate = (href: string) => {
    const targetHref = buildHref(href)
    console.log("[Sidebar] Navigate to:", href, "->", targetHref)
    router.push(targetHref)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            sidebarCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            {!sidebarCollapsed && <span className="text-lg font-semibold text-sidebar-foreground">DSPilot</span>}
          </button>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const NavButton = (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return NavButton
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-sidebar-border p-3">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            const NavButton = (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return NavButton
          })}

          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mt-2 w-full text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
