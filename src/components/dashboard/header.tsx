"use client"

import { useDashboardStore, getStations } from "@/lib/store"
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
import { Bell, ChevronLeft, ChevronRight, Calendar, User, LogOut, Settings, Moon, Sun } from "lucide-react"
import { format, startOfWeek, endOfWeek, getWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { useTheme } from "next-themes"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function Header() {
  const { selectedStation, setSelectedStation, granularity, setGranularity, selectedDate, navigatePeriod } =
    useDashboardStore()

  const { theme, setTheme } = useTheme()

  const stations = getStations()

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Station selector */}
          <Select
            value={selectedStation.id}
            onValueChange={(value) => {
              const station = stations.find((s) => s.id === value)
              if (station) setSelectedStation(station)
            }}
          >
            <SelectTrigger className="w-[180px] border-border bg-card text-card-foreground">
              <SelectValue>
                <span className="font-medium">{selectedStation.code}</span>
                <span className="ml-2 text-muted-foreground">- {selectedStation.name}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  <span className="font-medium">{station.code}</span> - {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period navigation */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[200px] text-center">
              <div className="text-sm font-medium capitalize">{period.main}</div>
              {period.sub && <div className="text-xs text-muted-foreground capitalize">{period.sub}</div>}
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="ml-2 border-l border-border pl-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Granularity selector */}
          <Select value={granularity} onValueChange={(value: "day" | "week") => setGranularity(value)}>
            <SelectTrigger className="w-[120px] border-border bg-card text-card-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                  JD
                </div>
                <span className="text-sm font-medium">Jean Doe</span>
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
