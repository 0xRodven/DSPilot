"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section
      className="px-6 py-28 text-center"
      style={{
        background: "linear-gradient(180deg, #FAFAF8 0%, #EFF6FF 100%)",
      }}
    >
      <div className="mx-auto max-w-[1200px]" data-scroll-reveal>
        <h2
          className="mb-4 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
          style={{ fontSize: "clamp(36px, 4vw, 52px)", color: "#1A1A1A" }}
        >
          You&apos;ve read this far.
          <br />
          <em className="bg-gradient-to-br from-[#2563EB] to-[#0891B2] bg-clip-text text-transparent italic">
            Your Monday mornings can change now.
          </em>
        </h2>

        <p className="mx-auto mb-8 max-w-[500px] text-lg" style={{ color: "#4A4A4A" }}>
          Start with the Pro plan. No commitment, no surprises.
        </p>

        <Link
          href="/sign-up"
          className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-base text-white transition-all duration-200"
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

        <p className="mt-4 text-[13px]" style={{ color: "#8A8A8A" }}>
          No commitment · Up and running in 2 minutes
        </p>
      </div>
    </section>
  );
}
