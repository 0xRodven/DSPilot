"use client"

import { ArrowRight, BarChart3, Target, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

import { AnimationContainer } from "@/components/global/animation-container"
import { Badge } from "@/components/ui/badge"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { MagicBadge } from "@/components/ui/magic-badge"

function DashboardPreview() {
  return (
    <div className="w-full rounded-xl border border-border/40 bg-slate-950 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Performance Station</h2>
          <p className="text-sm text-slate-400">Semaine du 23 Décembre 2024</p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
          Fantastic
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 className="size-4" />
            <span className="text-xs">Score DWC</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">98.7%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="size-4" />
            <span className="text-xs">Score IADC</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">99.2%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="size-4" />
            <span className="text-xs">Livreurs</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">47</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="size-4" />
            <span className="text-xs">Progression</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">+2.1%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Évolution hebdomadaire</h3>
        <div className="flex h-32 items-end justify-between gap-2">
          {[65, 72, 78, 85, 88, 92, 98].map((height, i) => (
            <div key={i} className="flex-1">
              <div
                className="rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>S1</span>
          <span>S2</span>
          <span>S3</span>
          <span>S4</span>
          <span>S5</span>
          <span>S6</span>
          <span>S7</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-800">
        <div className="grid grid-cols-4 gap-4 border-b border-slate-800 bg-slate-900/50 p-3 text-xs font-medium text-slate-400">
          <span>Livreur</span>
          <span className="text-center">DWC</span>
          <span className="text-center">IADC</span>
          <span className="text-center">Tier</span>
        </div>
        {[
          { name: "Amadou D.", dwc: "99.5%", iadc: "99.8%", tier: "Fantastic" },
          { name: "Fatou S.", dwc: "98.9%", iadc: "99.1%", tier: "Fantastic" },
          { name: "Moussa K.", dwc: "97.2%", iadc: "98.4%", tier: "Great" },
        ].map((driver, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 border-b border-slate-800 p-3 text-sm last:border-0">
            <span className="font-medium text-white">{driver.name}</span>
            <span className="text-center text-emerald-400">{driver.dwc}</span>
            <span className="text-center text-emerald-400">{driver.iadc}</span>
            <span className="text-center">
              <Badge
                className={
                  driver.tier === "Fantastic"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }
              >
                {driver.tier}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden py-20 md:py-32">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]" />

      <AnimationContainer className="flex flex-col items-center gap-6 text-center">
        <MagicBadge>Plateforme de gestion DSP Amazon</MagicBadge>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Pilotez la performance de vos{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            livreurs Amazon
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Analysez les métriques DWC et IADC, identifiez les axes d&apos;amélioration et
          accompagnez vos livreurs vers l&apos;excellence avec DSPilot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild className="gap-2">
            <Link href="/sign-up">
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Voir les fonctionnalités</Link>
          </Button>
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.2} className="relative mt-16 w-full max-w-5xl px-4">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -inset-4 z-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-cyan-400/30 to-blue-500/30 blur-3xl" />

        {/* Dashboard preview with BorderBeam */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-border/40 bg-background/50 p-2 shadow-2xl backdrop-blur-sm">
          <BorderBeam size={250} duration={12} delay={9} />
          <DashboardPreview />
        </div>
      </AnimationContainer>
    </section>
  )
}
