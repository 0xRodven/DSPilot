"use client";

import Link from "next/link";

import { ArrowRight, BarChart3, Target, TrendingUp, Users } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { MagicBadge } from "@/components/ui/magic-badge";

function DashboardPreview() {
  return (
    <div className="w-full rounded-xl border border-border/40 bg-slate-950 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-white">Performance Station</h2>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400 text-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <p className="text-slate-400 text-sm">Semaine 12 — Mars 2026</p>
        </div>
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
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
          <p className="mt-1 font-bold text-2xl text-emerald-400">98.7%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="size-4" />
            <span className="text-xs">Score IADC</span>
          </div>
          <p className="mt-1 font-bold text-2xl text-emerald-400">99.2%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="size-4" />
            <span className="text-xs">Livreurs</span>
          </div>
          <p className="mt-1 font-bold text-2xl text-white">47</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="size-4" />
            <span className="text-xs">Progression</span>
          </div>
          <p className="mt-1 font-bold text-2xl text-emerald-400">+2.1%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-4 font-medium text-slate-300 text-sm">Évolution hebdomadaire</h3>
        <div className="flex h-32 items-end justify-between gap-2">
          {[65, 72, 78, 85, 88, 92, 98].map((height, i) => (
            <div key={i} className="flex-1">
              <div className="rounded-t bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-slate-500 text-xs">
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
        <div className="grid grid-cols-4 gap-4 border-slate-800 border-b bg-slate-900/50 p-3 font-medium text-slate-400 text-xs">
          <span>Livreur</span>
          <span className="text-center">DWC</span>
          <span className="text-center">IADC</span>
          <span className="text-center">Tier</span>
        </div>
        {[
          { name: "A. D.", dwc: "99.5%", iadc: "99.8%", tier: "Fantastic" },
          { name: "F. S.", dwc: "98.9%", iadc: "99.1%", tier: "Fantastic" },
          { name: "M. K.", dwc: "97.2%", iadc: "98.4%", tier: "Great" },
        ].map((driver, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 border-slate-800 border-b p-3 text-sm last:border-0">
            <span className="font-medium text-white">{driver.name}</span>
            <span className="text-center text-emerald-400">{driver.dwc}</span>
            <span className="text-center text-emerald-400">{driver.iadc}</span>
            <span className="text-center">
              <Badge
                className={
                  driver.tier === "Fantastic"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                }
              >
                {driver.tier}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden py-20 md:py-32">
      {/* Glow effect */}
      <div className="-z-10 absolute top-0 right-0 left-0 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]" />

      <AnimationContainer className="flex flex-col items-center gap-6 text-center">
        <MagicBadge>Premier outil DSP en France</MagicBadge>

        <h1 className="max-w-4xl font-bold text-4xl text-foreground tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Pilotez votre{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            station DSP
          </span>
          .<br />
          Pas vos tableurs.
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Scores DWC, IADC, coaching livreurs, rapports hebdomadaires — tout ce que vous faites aujourd&apos;hui en 5
          heures sur Excel, DSPilot le fait en 30 secondes. Gardez votre tier Fantastic sans y passer vos nuits.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Link href="/sign-up">
              Demarrer gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link href="/demo">Voir une demo</Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Aucune carte requise · Import en 30 secondes · 20 livreurs gratuits
        </p>
      </AnimationContainer>

      <AnimationContainer delay={0.2} className="relative mt-16 w-full max-w-5xl px-4">
        {/* Glow effect */}
        <div className="-inset-4 pointer-events-none absolute z-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-cyan-400/30 to-blue-500/30 blur-3xl" />

        {/* Dashboard preview with BorderBeam */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-border/40 bg-background/50 p-2 shadow-2xl backdrop-blur-sm">
          <BorderBeam size={250} duration={12} delay={9} />
          <DashboardPreview />
        </div>
      </AnimationContainer>
    </section>
  );
}
