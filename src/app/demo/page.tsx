// src/app/demo/page.tsx
"use client";

import Link from "next/link";

import { useQuery } from "convex/react";

import { CalEmbed } from "@/components/landing/cal-embed";

import { api } from "../../../convex/_generated/api";

export default function DemoPage() {
  const data = useQuery(api.demo.getDashboardPublic);

  return (
    <main className="min-h-screen bg-[#F5F3EE] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-xl bg-[#2563EB] px-4 py-3 text-sm text-white">
          <strong>Données démo</strong> — vos données resteront privées. Cette page est générée à partir d&apos;une
          station anonymisée.
        </div>

        <h1 className="mb-6 font-semibold text-3xl text-[#1A1A1A]">Aperçu DSPilot</h1>

        {data === undefined ? (
          <p className="text-[#8A8A8A]">Chargement…</p>
        ) : data === null ? (
          <p className="text-[#8A8A8A]">Demo indisponible. Contactez-nous.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <Card label="Station" value={data.station.name} />
            <Card label="Livreurs suivis" value={String(data.driverCount)} />
            <Card label="Stats hebdo" value={String(data.weeklyStatsCount)} />
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center">
          <p className="mb-4 text-[#4A4A4A]">Envie de voir DSPilot avec vos vraies données&nbsp;?</p>
          <CalEmbed
            namespace="demo-page"
            trigger={
              <button type="button" className="rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-white">
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6">
      <p className="mb-1 text-[#8A8A8A] text-xs uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-2xl text-[#1A1A1A]">{value}</p>
    </div>
  );
}
