"use client";

import Link from "next/link";

import { ArrowRight, Play } from "lucide-react";

import { BrowserFrame } from "./browser-frame";
import { DashboardMockup } from "./mockups";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Background Orbs */}
      <div
        className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(37,99,235,0.08)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(8,145,178,0.06)" }}
      />
      <div
        className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(37,99,235,0.05)" }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#2563EB" }} />
          <span className="font-medium text-sm" style={{ color: "#1e40af" }}>
            Le seul outil DSP Amazon en France
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mb-6 font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight md:text-6xl lg:text-7xl"
          style={{ color: "#1A1A1A" }}
        >
          Pilotez votre{" "}
          <span
            className="italic"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #0891b2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            station DSP
          </span>
          .<br />
          Pas vos tableurs.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: "#4A4A4A" }}>
          Scores DWC, IADC, coaching livreurs, rapports hebdomadaires — tout ce que vous faites aujourd&apos;hui en 5
          heures sur Excel, DSPilot le fait en 30 secondes. Gardez votre tier Fantastic sans y laisser vos soirées.
        </p>

        {/* CTAs */}
        <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all"
            style={{ background: "#2563EB" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563EB";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Démarrer avec DSPilot
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#demo"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all"
            style={{
              background: "transparent",
              border: "1px solid #E8E5DF",
              color: "#1A1A1A",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2563EB";
              e.currentTarget.style.color = "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E8E5DF";
              e.currentTarget.style.color = "#1A1A1A";
            }}
          >
            <Play className="h-4 w-4" />
            Voir une démo
          </Link>
        </div>

        {/* Reassurance */}
        <p className="text-sm" style={{ color: "#8A8A8A" }}>
          14 jours satisfait ou remboursé · Import en 30 secondes
        </p>
      </div>

      {/* Browser Frame with Dashboard */}
      <div className="relative z-10 mx-auto mt-16 max-w-5xl px-6">
        {/* Glow Effect */}
        <div
          className="-z-10 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-full w-full rounded-3xl blur-3xl"
          style={{ background: "rgba(37,99,235,0.1)" }}
        />
        <BrowserFrame url="app.dspilot.fr/dashboard">
          <DashboardMockup />
        </BrowserFrame>
      </div>
    </section>
  );
}
