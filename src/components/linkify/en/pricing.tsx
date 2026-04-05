"use client";

import { useState } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Pro",
    tagline: "The complete dashboard to run your station day to day.",
    price: { monthly: 499, yearly: 399 },
    features: [
      "Unlimited drivers",
      "Full dashboard with 8-week trends",
      "Unlimited history",
      "PDF and Excel exports",
      "Automatic alerts",
      "Error analysis per driver",
      "Priority email support",
    ],
    cta: "Go Pro",
    href: "/sign-up?plan=pro",
  },
  {
    name: "Business",
    tagline: "Performance, coaching and reports — zero friction.",
    price: { monthly: 999, yearly: 799 },
    popular: true,
    features: [
      "Everything in Pro +",
      "Built-in coaching (Kanban, escalation, scheduling)",
      "Individual driver reports",
      "Weekly WhatsApp recaps",
      "Auto-generated professional reports",
      "API access",
      "Priority support",
    ],
    cta: "Choose Business",
    href: "/sign-up?plan=business",
  },
  {
    name: "Enterprise",
    tagline: "For multi-station groups who want a partner, not a tool.",
    price: { monthly: null, yearly: null },
    features: [
      "Everything in Business +",
      "Centralised multi-station view",
      "SSO/SAML",
      "Dedicated account manager",
      "99.9% SLA",
      "Phone support",
      "Onboarding + training",
    ],
    cta: "Contact us",
    href: "mailto:sales@dspilot.fr",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="px-6 py-28">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-12 text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            Pricing
          </p>
          <h2
            className="mb-4 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Pays for itself
            <br />
            in the first week.
          </h2>
          <p className="mx-auto max-w-3xl text-lg" style={{ color: "#4A4A4A" }}>
            DSPilot saves you 3 to 5 hours every week. Over a month, that&apos;s 3 full working days back.
          </p>
        </div>

        {/* Toggle */}
        <div
          className="mx-auto mb-12 flex w-fit gap-2 rounded-xl p-1"
          style={{ background: "#F5F3EE" }}
          data-scroll-reveal
        >
          <button
            type="button"
            onClick={() => {
              setIsYearly(false);
            }}
            className={cn(
              "rounded-lg px-6 py-2.5 font-medium text-sm transition-all duration-200",
              !isYearly ? "bg-white text-[#1A1A1A] shadow-sm" : "bg-transparent text-[#4A4A4A]",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => {
              setIsYearly(true);
            }}
            className={cn(
              "rounded-lg px-6 py-2.5 font-medium text-sm transition-all duration-200",
              isYearly ? "bg-white text-[#1A1A1A] shadow-sm" : "bg-transparent text-[#4A4A4A]",
            )}
          >
            Yearly <span style={{ color: "#2563EB" }}>-20%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-scroll-reveal>
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "hover:-translate-y-1 relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
                plan.popular ? "border-2" : "",
              )}
              style={{
                background: "#FFFFFF",
                borderColor: plan.popular ? "#2563EB" : "#E8E5DF",
                boxShadow: plan.popular ? "0 8px 30px rgba(37,99,235,0.1)" : undefined,
              }}
            >
              {plan.popular && (
                <div
                  className="-top-3 -translate-x-1/2 absolute left-1/2 rounded-full px-4 py-1 font-semibold text-white text-xs"
                  style={{ background: "#2563EB" }}
                >
                  Recommended
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-semibold text-xl" style={{ color: "#1A1A1A" }}>
                  {plan.name}
                </h3>
                <p className="mt-1 min-h-[40px] text-sm" style={{ color: "#8A8A8A" }}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-1">
                {plan.price.monthly !== null ? (
                  <span
                    className="font-[family-name:var(--font-display)]"
                    style={{ fontSize: "42px", color: "#1A1A1A" }}
                  >
                    {isYearly ? plan.price.yearly : plan.price.monthly}
                    {plan.price.monthly > 0 && (
                      <span className="font-normal text-sm" style={{ color: "#8A8A8A" }}>
                        &euro;
                      </span>
                    )}
                  </span>
                ) : (
                  <span
                    className="font-[family-name:var(--font-display)]"
                    style={{ fontSize: "32px", color: "#1A1A1A" }}
                  >
                    Custom
                  </span>
                )}
              </div>
              {plan.price.monthly !== null && plan.price.monthly > 0 && (
                <p className="mb-6 text-sm" style={{ color: "#8A8A8A" }}>
                  per month
                </p>
              )}
              {plan.price.monthly === null && <div className="mb-6" />}

              <ul className="mb-8 flex-1 space-y-0">
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 border-b py-2.5 text-sm"
                    style={{ borderColor: "#f0eeea", color: "#4A4A4A" }}
                  >
                    <span className="shrink-0 font-semibold" style={{ color: "#2563EB" }}>
                      &#10003;
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  "block w-full rounded-xl py-3.5 text-center font-semibold text-[15px] transition-all duration-200",
                  plan.popular ? "text-white" : "border",
                )}
                style={{
                  background: plan.popular ? "#2563EB" : "transparent",
                  borderColor: plan.popular ? undefined : "#E8E5DF",
                  color: plan.popular ? "#FFFFFF" : "#1A1A1A",
                }}
                onMouseEnter={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = "#1d4ed8";
                  } else {
                    e.currentTarget.style.borderColor = "#8A8A8A";
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = "#2563EB";
                  } else {
                    e.currentTarget.style.borderColor = "#E8E5DF";
                  }
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <div className="mt-8 text-center text-[13px]" style={{ color: "#8A8A8A" }} data-scroll-reveal>
          No commitment · Encrypted data · GDPR compliant
        </div>
      </div>
    </section>
  );
}
