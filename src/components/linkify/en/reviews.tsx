"use client";

import { Lock, Shield, User } from "lucide-react";

const trustBlocks = [
  {
    icon: User,
    title: "Born on the ground, not in a lab.",
    description:
      "DSPilot was built by an Amazon DSP station manager who spent his Monday mornings in Excel. Every feature solves a real problem, not a consultant's hypothesis.",
  },
  {
    icon: Shield,
    title: "Fast, stable, always up to date.",
    description:
      "DSPilot runs on enterprise-grade infrastructure: real-time data, zero-downtime updates, permanent availability. This isn't a shared file that crashes when two people open it at once.",
  },
  {
    icon: Lock,
    title: "Your data never leaves secure infrastructure.",
    description:
      "TLS encryption, reinforced authentication, European hosting. Your station metrics and driver data are protected to industry standards.",
  },
];

export function Reviews() {
  return (
    <section className="px-6 py-28" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            Trust
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Built by a DSP owner. For DSP owners.
          </h2>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {trustBlocks.map((block, i) => (
            <div
              key={i}
              data-scroll-reveal
              data-scroll-delay={String(i * 0.1)}
              className="rounded-xl border p-8"
              style={{
                background: "#FFFFFF",
                borderColor: "#E8E5DF",
              }}
            >
              <div
                className="mb-5 flex size-11 items-center justify-center rounded-xl"
                style={{ background: "#EFF6FF", color: "#2563EB" }}
              >
                <block.icon className="size-5" />
              </div>
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl" style={{ color: "#1A1A1A" }}>
                {block.title}
              </h3>
              <p className="text-[15px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
                {block.description}
              </p>
            </div>
          ))}
        </div>

        <div data-scroll-reveal>
          <p
            className="mx-auto max-w-[720px] text-center font-[family-name:var(--font-display)] text-xl italic leading-[1.8]"
            style={{ color: "#4A4A4A" }}
          >
            DSPilot didn&apos;t come out of a boardroom brainstorm. It was born from a simple reality: an Amazon DSP
            owner has no tool built for the job. The American solutions don&apos;t understand European operations, and
            generic fleet tools don&apos;t speak Amazon. So we built the tool we wished we&apos;d had from day one.
            Every screen, every alert, every report was designed by someone who&apos;s lived through Monday mornings
            copy-pasting scorecards into Excel. We know the business because we run one.
          </p>
        </div>
      </div>
    </section>
  );
}
