import type { Metadata } from "next";

import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { CTA } from "@/components/linkify/cta";
import { FAQ } from "@/components/linkify/faq";
import { Features } from "@/components/linkify/features";
import { Footer } from "@/components/linkify/footer";
import { Hero } from "@/components/linkify/hero";
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
    <div className="dark relative min-h-screen bg-[#0a0a0a] text-white">
      {/* Grid pattern background */}
      <div className="pointer-events-none fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
      <Navbar />
      <main>
        <MaxWidthWrapper>
          <Hero />
          <Features />
          <Process />
          <Pricing />
          <Reviews />
          <FAQ />
          <CTA />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </div>
  );
}
