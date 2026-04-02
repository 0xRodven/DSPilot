import type { Metadata } from "next";

import { CTA } from "@/components/linkify/cta";
import { FAQ } from "@/components/linkify/faq";
import { Features } from "@/components/linkify/features";
import { Footer } from "@/components/linkify/footer";
import { Hero } from "@/components/linkify/hero";
import { LenisProvider } from "@/components/linkify/lenis-provider";
import { Navbar } from "@/components/linkify/navbar";
import { Pricing } from "@/components/linkify/pricing";
import { Process } from "@/components/linkify/process";
import { Reviews } from "@/components/linkify/reviews";

export const metadata: Metadata = {
  title: "DSPilot — Pilotez votre station DSP. Pas vos tableurs.",
  description:
    "Scores DWC, IADC, coaching livreurs, rapports hebdomadaires — tout ce que vous faites en 5 heures sur Excel, DSPilot le fait en 30 secondes. Le premier outil DSP en France.",
  keywords: ["Amazon DSP", "livraison", "performance", "DWC", "IADC", "coaching", "gestion", "livreurs"],
  openGraph: {
    title: "DSPilot — Pilotez votre station DSP. Pas vos tableurs.",
    description:
      "Scores DWC, IADC, coaching livreurs, rapports hebdomadaires — tout ce que vous faites en 5 heures sur Excel, DSPilot le fait en 30 secondes. Le premier outil DSP en France.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen font-[family-name:var(--font-body)]"
      style={{ background: "#FAFAF8", color: "#1A1A1A" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(37,99,235,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(8,145,178,0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(5,150,105,0.04) 0%, transparent 50%)
          `,
        }}
      />
      <LenisProvider>
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Process />
          <Pricing />
          <Reviews />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </LenisProvider>
    </div>
  );
}
