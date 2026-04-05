"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { BrowserFrame } from "@/components/linkify/browser-frame";
import { DashboardMockup } from "@/components/linkify/mockups";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-8 md:pt-28 md:pb-16">
      {/* Premium mesh gradient background — multiple soft blurred orbs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Top-right blue orb */}
        <div
          className="-right-[150px] -top-[150px] absolute"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)",
          }}
        />
        {/* Center-left teal orb */}
        <div
          className="-left-[100px] absolute top-[30%]"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 65%)",
          }}
        />
        {/* Bottom-center warm orb */}
        <div
          className="absolute bottom-0 left-[40%]"
          style={{
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(37,99,235,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Text + CTAs */}
        <div className="mx-auto max-w-3xl text-center" data-scroll-reveal>
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-medium text-[13px]"
            style={{
              background: "#EFF6FF",
              borderColor: "#DBEAFE",
              color: "#2563EB",
            }}
          >
            <span className="relative flex size-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: "#2563EB" }}
              />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "#2563EB" }} />
            </span>
            Built by a DSP owner. For DSP owners.
          </div>

          <h1
            className="font-[family-name:var(--font-display)] leading-[1.08] tracking-[-0.03em]"
            style={{ fontSize: "clamp(42px, 5vw, 72px)", color: "#1A1A1A" }}
          >
            Run your{" "}
            <em className="bg-gradient-to-br from-[#2563EB] to-[#0891B2] bg-clip-text text-transparent italic">DSP.</em>
            <br />
            Not your spreadsheets.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.7]" style={{ color: "#4A4A4A" }}>
            DWC scores, driver coaching, weekly reports — everything you spend 5&nbsp;hours on in Excel, DSPilot does in
            30&nbsp;seconds. Keep your Fantastic tier without burning your evenings.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-base text-white transition-all duration-200"
              style={{
                background: "#2563EB",
                boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2563EB";
              }}
            >
              Get started with DSPilot
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center rounded-xl border px-8 py-3.5 font-medium text-base transition-all duration-200"
              style={{ borderColor: "#E8E5DF", color: "#1A1A1A" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8A8A8A";
                e.currentTarget.style.background = "#F5F3EE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8E5DF";
                e.currentTarget.style.background = "transparent";
              }}
            >
              See a demo
            </Link>
          </div>

          <p className="mt-4 text-[13px] tracking-wide" style={{ color: "#8A8A8A" }}>
            Import in 30 seconds · No commitment
          </p>
        </div>

        {/* Product screenshot in browser frame — full width, centered */}
        <div className="mt-16 px-4" data-scroll-reveal data-scroll-delay="0.2">
          <div className="mx-auto max-w-5xl">
            {/* Glow behind frame */}
            <div className="relative">
              <div
                className="-inset-8 pointer-events-none absolute z-0 rounded-3xl opacity-60"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <BrowserFrame>
                  <DashboardMockup />
                </BrowserFrame>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
