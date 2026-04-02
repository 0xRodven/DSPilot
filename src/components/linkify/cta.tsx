"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section
      className="py-24"
      style={{
        background: "linear-gradient(to bottom, #FAFAF8, #EFF6FF)",
      }}
    >
      <div className="mx-auto max-w-4xl px-6 text-center" data-scroll-reveal>
        <h2
          className="mb-8 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
          style={{ color: "#1A1A1A" }}
        >
          Vous avez lu jusqu&apos;ici.
          <br />
          <span
            className="italic"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #0891b2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Vos lundis matins peuvent changer maintenant.
          </span>
        </h2>

        <Link
          href="/sign-up"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-8 py-4 font-medium text-lg text-white transition-all"
          style={{ background: "#2563EB" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(37,99,235,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2563EB";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Démarrer avec DSPilot
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="text-sm" style={{ color: "#8A8A8A" }}>
          14 jours satisfait ou remboursé · Opérationnel en 2 minutes
        </p>
      </div>
    </section>
  );
}
