import type { Metadata } from "next";

import { CTA } from "@/components/linkify/en/cta";
import { FAQ } from "@/components/linkify/en/faq";
import { Features } from "@/components/linkify/en/features";
import { Footer } from "@/components/linkify/en/footer";
import { Hero } from "@/components/linkify/en/hero";
import { Navbar } from "@/components/linkify/en/navbar";
import { Pricing } from "@/components/linkify/en/pricing";
import { Process } from "@/components/linkify/en/process";
import { Reviews } from "@/components/linkify/en/reviews";
import { LenisProvider } from "@/components/linkify/lenis-provider";

export const metadata: Metadata = {
  title: "DSPilot — Run your DSP. Not your spreadsheets.",
  description:
    "DWC scores, driver coaching, weekly reports — everything you spend 5 hours on in Excel, DSPilot does in 30 seconds. The driver performance platform built by a DSP owner.",
  keywords: ["Amazon DSP", "delivery", "performance", "DWC", "scorecard", "coaching", "driver management"],
  openGraph: {
    title: "DSPilot — Run your DSP. Not your spreadsheets.",
    description:
      "DWC scores, driver coaching, weekly reports — everything you spend 5 hours on in Excel, DSPilot does in 30 seconds. The driver performance platform built by a DSP owner.",
    type: "website",
    locale: "en_GB",
  },
};

export default function LandingPageEN() {
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
