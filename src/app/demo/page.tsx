"use client";

import Link from "next/link";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { CalEmbed } from "@/components/landing/cal-embed";
import { cn } from "@/lib/utils";
import { getTierBgColor, type Tier } from "@/lib/utils/tier";

import { api } from "../../../convex/_generated/api";

type DemoData = NonNullable<FunctionReturnType<typeof api.demo.getDashboardPublic>>;
type DriverScore = DemoData["topDrivers"][number];

const TIER_LABEL: Record<Tier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
};

const TIER_ORDER: readonly Tier[] = ["fantastic", "great", "fair", "poor"];

export default function DemoPage() {
  const data = useQuery(api.demo.getDashboardPublic);

  return (
    <main className="min-h-screen bg-[#F5F3EE] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-xl bg-[#2563EB] px-4 py-3 text-sm text-white">
          <strong>Données démo</strong> — station anonymisée. Vos données resteront privées.
        </div>

        <header className="mb-10">
          <h1 className="font-semibold text-3xl text-[#1A1A1A]">Aperçu DSPilot</h1>
          <p className="mt-2 text-[#4A4A4A]">
            Pilotage temps réel des performances livreurs Amazon — DWC, IADC, coaching.
          </p>
        </header>

        {data === undefined ? <DemoSkeleton /> : data === null ? <DemoUnavailable /> : <DemoBoard data={data} />}

        <div className="mt-12 rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center">
          <p className="mb-4 text-[#4A4A4A]">Envie de voir DSPilot avec vos vraies données&nbsp;?</p>
          <CalEmbed
            namespace="demo-page"
            trigger={
              <button
                type="button"
                className="rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Réserver une démo
              </button>
            }
          />
        </div>

        <p className="mt-8 text-center text-[#8A8A8A] text-xs">
          <Link href="/" className="underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}

function DemoBoard({ data }: { data: DemoData }) {
  const { drivers, latestWeek, topDrivers, bottomDrivers, weeksOfData } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        <Stat label="Station" value={data.station.name} hint={data.station.code} />
        <Stat label="Livreurs actifs" value={`${drivers.active} / ${drivers.total}`} hint="suivis" />
        <Stat
          label="DWC station"
          value={latestWeek ? `${latestWeek.dwcScore}%` : "—"}
          hint={latestWeek ? `S${latestWeek.week} ${latestWeek.year}` : ""}
        />
        <Stat
          label="IADC station"
          value={latestWeek ? `${latestWeek.iadcScore}%` : "—"}
          hint={`${weeksOfData} semaine${weeksOfData > 1 ? "s" : ""} de données`}
        />
      </div>

      {latestWeek && (
        <Section title="Distribution des tiers">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TIER_ORDER.map((tier) => (
              <TierCard key={tier} tier={tier} count={latestWeek.tierDistribution[tier]} total={drivers.total} />
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Top 3 livreurs">
          <DriverList drivers={topDrivers} emptyLabel="Aucune donnée." />
        </Section>
        <Section title="À accompagner">
          <DriverList drivers={bottomDrivers} emptyLabel="Aucune donnée." />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6">
      <h2 className="mb-4 font-semibold text-[#1A1A1A] text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6">
      <p className="mb-1 text-[#8A8A8A] text-xs uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-2xl text-[#1A1A1A]">{value}</p>
      {hint ? <p className="mt-1 text-[#8A8A8A] text-xs">{hint}</p> : null}
    </div>
  );
}

function TierCard({ tier, count, total }: { tier: Tier; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-[#E8E5DF] bg-[#FAFAF7] p-4">
      <div className="flex items-center justify-between">
        <span className={cn("rounded-full px-2 py-0.5 font-medium text-xs", getTierBgColor(tier))}>
          {TIER_LABEL[tier]}
        </span>
        <span className="text-[#8A8A8A] text-xs">{pct}%</span>
      </div>
      <p className="mt-3 font-semibold text-2xl text-[#1A1A1A]">{count}</p>
      <p className="text-[#8A8A8A] text-xs">livreurs</p>
    </div>
  );
}

function DriverList({ drivers, emptyLabel }: { drivers: DriverScore[]; emptyLabel: string }) {
  if (drivers.length === 0) {
    return <p className="text-[#8A8A8A] text-sm">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {drivers.map((d) => (
        <li
          key={`${d.name}-${d.dwcScore}`}
          className="flex items-center justify-between rounded-xl border border-[#E8E5DF] bg-[#FAFAF7] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className={cn("rounded-full px-2 py-0.5 font-medium text-xs", getTierBgColor(d.tier))}>
              {TIER_LABEL[d.tier]}
            </span>
            <span className="font-medium text-[#1A1A1A] text-sm">{d.name}</span>
          </div>
          <span className="font-semibold text-[#1A1A1A] text-sm tabular-nums">{d.dwcScore}%</span>
        </li>
      ))}
    </ul>
  );
}

function DemoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <div key={k} className="h-28 animate-pulse rounded-2xl border border-[#E8E5DF] bg-white" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-2xl border border-[#E8E5DF] bg-white" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-[#E8E5DF] bg-white" />
        <div className="h-56 animate-pulse rounded-2xl border border-[#E8E5DF] bg-white" />
      </div>
    </div>
  );
}

function DemoUnavailable() {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center">
      <p className="font-medium text-[#1A1A1A]">Démo en cours de préparation.</p>
      <p className="mt-2 text-[#4A4A4A] text-sm">Réservez un créneau ci-dessous, on vous présente DSPilot en direct.</p>
    </div>
  );
}
