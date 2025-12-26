"use client"

import { useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronLeft, ChevronRight, Calendar, User, LogOut, Settings, Moon, Sun, Loader2 } from "lucide-react"
import { format, startOfWeek, endOfWeek, getWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { useTheme } from "next-themes"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export function Header() {
  const { selectedStation, setSelectedStation, granularity, setGranularity, selectedDate, navigatePeriod } =
    useDashboardStore()

  const { theme, setTheme } = useTheme()

  // Load stations from Convex
  const stations = useQuery(api.stations.listUserStations)
  const isLoadingStations = stations === undefined

  // Auto-select first station when loaded and no station is selected
  useEffect(() => {
    if (stations && stations.length > 0 && !selectedStation.id) {
      const first = stations[0]
      setSelectedStation({
        id: first._id,
        name: first.name,
        code: first.code,
      })
    }
  }, [stations, selectedStation.id, setSelectedStation])

  const formatPeriod = () => {
    if (granularity === "week") {
      const weekNum = getWeek(selectedDate, { locale: fr })
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
      return {
        main: `Semaine ${weekNum}, ${selectedDate.getFullYear()}`,
        sub: `${format(start, "d", { locale: fr })} - ${format(end, "d MMMM", { locale: fr })}`,
      }
    }
    return {
      main: format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }),
      sub: null,
    }
  }

  const period = formatPeriod()

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 md:px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

      <div className="flex flex-1 items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Station selector */}
          {isLoadingStations ? (
            <Skeleton className="h-9 w-[100px] md:w-[180px]" />
          ) : stations && stations.length > 0 ? (
            <Select
              value={selectedStation.id}
              onValueChange={(value) => {
                const station = stations.find((s) => s._id === value)
                if (station) {
                  setSelectedStation({
                    id: station._id,
                    name: station.name,
                    code: station.code,
                  })
                }
              }}
            >
              <SelectTrigger className="w-[100px] md:w-[180px] border-border bg-card text-card-foreground h-9">
                <SelectValue>
                  {selectedStation.code ? (
                    <>
                      <span className="font-medium">{selectedStation.code}</span>
                      <span className="ml-2 text-muted-foreground hidden md:inline">- {selectedStation.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Station</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {stations.map((station) => (
                  <SelectItem key={station._id} value={station._id}>
                    <span className="font-medium">{station.code}</span> - {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-auto border-dashed text-xs md:text-sm"
              onClick={() => window.location.href = "/dashboard/import"}
            >
              <span className="hidden sm:inline">Importer une station</span>
              <span className="sm:hidden">Import</span>
            </Button>
          )}

          {/* Period navigation */}
          <div className="flex items-center gap-1 md:gap-2 rounded-lg border border-border bg-card px-2 md:px-3 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[80px] md:min-w-[200px] text-center">
              <div className="text-xs md:text-sm font-medium capitalize truncate">{period.main}</div>
              {period.sub && <div className="text-[10px] md:text-xs text-muted-foreground capitalize hidden sm:block">{period.sub}</div>}
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="ml-1 md:ml-2 border-l border-border pl-1 md:pl-2 hidden sm:block">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Granularity selector - hidden on mobile */}
          <Select value={granularity} onValueChange={(value: "day" | "week") => setGranularity(value)}>
            <SelectTrigger className="w-[80px] md:w-[120px] border-border bg-card text-card-foreground h-9 hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative h-8 w-8 md:h-9 md:w-9"
          >
            <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-9 md:w-9">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-1 pr-2 md:pl-2 md:pr-3 h-8 md:h-9">
                <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/20 text-xs md:text-sm font-medium text-primary">
                  JD
                </div>
                <span className="text-sm font-medium hidden md:inline">Jean Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
