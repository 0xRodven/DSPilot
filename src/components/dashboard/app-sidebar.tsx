"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, AlertTriangle, GraduationCap, Upload, Settings, Truck, ChevronUp, ChevronRight, Calendar, ClipboardList, MessageSquare } from "lucide-react"
import { useBuildFilteredHref } from "@/lib/filters"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Drivers", href: "/dashboard/drivers" },
  { icon: AlertTriangle, label: "Erreurs", href: "/dashboard/errors" },
  { icon: Upload, label: "Import", href: "/dashboard/import" },
]

const coachingSubItems = [
  { icon: ClipboardList, label: "Planification", href: "/dashboard/coaching" },
  { icon: Calendar, label: "Calendrier", href: "/dashboard/coaching/calendar" },
  { icon: MessageSquare, label: "Récapitulatifs", href: "/dashboard/coaching/recaps" },
]

const bottomNavItems = [{ icon: Settings, label: "Paramètres", href: "/dashboard/settings" }]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const buildHref = useBuildFilteredHref()

  // Navigation handler that preserves filter params
  const handleNavigate = (href: string) => {
    const targetHref = buildHref(href)
    router.push(targetHref)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => handleNavigate("/dashboard")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">DSPilot</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => handleNavigate(item.href)}>
                      <item.icon className={isActive ? "text-primary" : ""} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Coaching with submenu */}
              <Collapsible asChild defaultOpen={pathname.startsWith("/dashboard/coaching")} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Coaching"
                      isActive={pathname.startsWith("/dashboard/coaching")}
                    >
                      <GraduationCap className={pathname.startsWith("/dashboard/coaching") ? "text-primary" : ""} />
                      <span>Coaching</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {coachingSubItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton isActive={isActive} onClick={() => handleNavigate(item.href)}>
                              <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                              <span>{item.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => handleNavigate(item.href)}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">JD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Jean Doe</span>
                    <span className="truncate text-xs text-muted-foreground">jean@example.com</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href={buildHref("/dashboard/settings")}>Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={buildHref("/dashboard/settings")}>Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
