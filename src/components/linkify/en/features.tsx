"use client";

import { AlertTriangle, BarChart3, Calendar, Clock, FileSpreadsheet, FileUp, Users } from "lucide-react";

import { BrowserFrame } from "@/components/linkify/browser-frame";
import { CoachingMockup, DriverMockup, ImportMockup, ReportMockup } from "@/components/linkify/mockups";

const painPoints = [
  {
    icon: Clock,
    title: "5 hours a week in Excel. Every single week.",
    description:
      "Copy the Amazon scorecards, paste into a spreadsheet, reformat, cross-reference the data, build the report. You're not managing your station anymore — you're doing data entry.",
  },
  {
    icon: AlertTriangle,
    title: "A driver slips. You find out too late.",
    description:
      "Without a centralised view, a dropping DWC score goes unnoticed for two, three weeks. By the time you react, your entire station's tier is at risk.",
  },
  {
    icon: FileSpreadsheet,
    title: "Coaching on sticky notes. Results on paper.",
    description:
      "You know who needs coaching. But between scattered WhatsApp messages, informal notes and untracked meetings, nothing is structured. The same driver goes back to red the following month.",
  },
];

const featuresSections = [
  {
    icon: FileUp,
    label: "Import",
    title: "30 seconds. Not 3 hours.",
    description:
      "Copy the Amazon metrics table, paste into DSPilot. Metrics are extracted, cleaned and ranked automatically. Your Monday morning goes back to management, not data entry.",
    mockup: ImportMockup,
    url: "app.dspilot.fr/dashboard/import",
    imageRight: true,
  },
  {
    icon: Calendar,
    label: "Coaching",
    title: "Every struggling driver gets an action plan.",
    description:
      "A dedicated Kanban — Detection, Pending, Evaluation, Done — with an escalation pipeline and built-in scheduling. No driver slips through the cracks.",
    mockup: CoachingMockup,
    url: "app.dspilot.fr/dashboard/coaching",
    imageRight: false,
  },
  {
    icon: Users,
    label: "Individual tracking",
    title: "Every driver gets their own performance report.",
    description:
      "Individual reports with personalised analysis of their metrics, strengths and areas for improvement. The driver knows exactly where they stand — and you didn't have to write a thing.",
    mockup: DriverMockup,
    url: "app.dspilot.fr/dashboard/drivers/amadou-d",
    imageRight: true,
  },
  {
    icon: BarChart3,
    label: "Reports",
    title: "The Monday report? Already done.",
    description:
      "Every week, DSPilot generates a professional report ready to send and delivers individual recaps to each driver via WhatsApp. Amazon gets a polished document; your drivers get a clear roadmap.",
    mockup: ReportMockup,
    url: "app.dspilot.fr/dashboard/reports",
    imageRight: false,
  },
];

export function Features() {
  return (
    <section id="features" className="px-6">
      {/* Pain Points */}
      <div className="mx-auto max-w-[1200px] pt-28 pb-20">
        <div data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#DC2626" }}>
            The problem
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Your Monday morning
            <br />
            looks like this.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {painPoints.map((pain, i) => (
            <div
              key={i}
              data-scroll-reveal
              data-scroll-delay={String(i * 0.1)}
              className="group rounded-xl border border-[#E8E5DF] bg-white p-8 transition-all duration-300 hover:border-red-500 hover:shadow-lg"
            >
              <div
                className="mb-5 flex size-11 items-center justify-center rounded-xl"
                style={{ background: "#FEF2F2", color: "#DC2626" }}
              >
                <pain.icon className="size-5" />
              </div>
              <h3
                className="mb-3 font-[family-name:var(--font-display)] text-[22px] leading-[1.3]"
                style={{ color: "#1A1A1A" }}
              >
                {pain.title}
              </h3>
              <p className="text-[15px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
                {pain.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features — alternating text/image sections */}
      <div className="mx-auto max-w-[1200px] pt-12 pb-28">
        <div className="mb-16 text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            The solution
          </p>
          <h2
            className="font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            A dashboard built for
            <br />
            DSP owners.
          </h2>
        </div>

        <div className="space-y-24">
          {featuresSections.map((feature, i) => {
            const MockupComponent = feature.mockup;
            return (
              <div
                key={i}
                className={`grid items-center gap-12 md:grid-cols-2 lg:gap-20 ${
                  feature.imageRight ? "" : "md:direction-rtl"
                }`}
                data-scroll-reveal
              >
                {/* Text */}
                <div className={feature.imageRight ? "md:order-1" : "md:order-2"}>
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{ background: "#EFF6FF", color: "#2563EB" }}
                    >
                      <feature.icon className="size-4" />
                    </div>
                    <span className="font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
                      {feature.label}
                    </span>
                  </div>

                  <h3
                    className="mb-4 font-[family-name:var(--font-display)] text-[32px] leading-[1.2] tracking-[-0.02em]"
                    style={{ color: "#1A1A1A" }}
                  >
                    {feature.title}
                  </h3>

                  <p className="text-[16px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
                    {feature.description}
                  </p>
                </div>

                {/* Product image in browser frame */}
                <div className={feature.imageRight ? "md:order-2" : "md:order-1"}>
                  <BrowserFrame url={feature.url} perspective={false}>
                    <MockupComponent />
                  </BrowserFrame>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
