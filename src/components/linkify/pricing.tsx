"use client";

import { useState } from "react";

import Link from "next/link";

import { Check } from "lucide-react";

const plans = [
  {
    name: "Pro",
    description: "Le tableau de bord complet pour piloter votre station au quotidien.",
    monthlyPrice: 499,
    yearlyPrice: 399,
    features: [
      "Livreurs illimités",
      "Dashboard complet tendances 8 semaines",
      "Historique illimité",
      "Export PDF et Excel",
      "Alertes automatiques",
      "Analyse erreurs par livreur",
      "Support email prioritaire",
    ],
    cta: "Passer au Pro",
    popular: false,
    href: "/sign-up?plan=pro",
  },
  {
    name: "Business",
    description: "Performance, coaching et rapports — sans friction.",
    monthlyPrice: 999,
    yearlyPrice: 799,
    features: [
      "Tout Pro +",
      "Coaching intégré (Kanban, escalade, calendrier)",
      "Rapports individuels par livreur",
      "Récaps WhatsApp hebdomadaires",
      "Rapports professionnels auto",
      "Accès API",
      "Support prioritaire",
    ],
    cta: "Choisir Business",
    popular: true,
    href: "/sign-up?plan=business",
  },
  {
    name: "Enterprise",
    description: "Pour les groupes multi-stations qui veulent un partenaire, pas un outil.",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      "Tout Business +",
      "Multi-stations centralisé",
      "SSO/SAML",
      "Account manager dédié",
      "SLA 99.9%",
      "Support téléphonique",
      "Onboarding + formation",
    ],
    cta: "Contactez-nous",
    popular: false,
    href: "mailto:sales@dspilot.fr",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#2563EB" }}>
            Tarifs
          </div>
          <h2
            className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Un abonnement qui se rembourse
            <br />
            dès la première semaine.
          </h2>
          <p className="text-lg" style={{ color: "#4A4A4A" }}>
            DSPilot vous fait gagner 3 à 5 heures par semaine. À l&apos;échelle d&apos;un mois, c&apos;est
            l&apos;équivalent de 3 jours de travail récupérés.
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setIsYearly(false);
            }}
            className="px-4 py-2 font-medium text-sm transition-all"
            style={{
              color: isYearly ? "#8A8A8A" : "#1A1A1A",
              borderBottom: isYearly ? "2px solid transparent" : "2px solid #2563EB",
            }}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => {
              setIsYearly(true);
            }}
            className="px-4 py-2 font-medium text-sm transition-all"
            style={{
              color: isYearly ? "#1A1A1A" : "#8A8A8A",
              borderBottom: isYearly ? "2px solid #2563EB" : "2px solid transparent",
            }}
          >
            Annuel
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs" style={{ background: "#ECFDF5", color: "#059669" }}>
              -20%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="mb-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl p-8 transition-all"
              style={{
                background: "#FFFFFF",
                border: plan.popular ? "2px solid #2563EB" : "1px solid #E8E5DF",
                boxShadow: plan.popular ? "0 8px 30px rgba(37,99,235,0.15)" : "none",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div
                  className="-top-3 -translate-x-1/2 absolute left-1/2 rounded-full px-4 py-1 font-semibold text-white text-xs"
                  style={{ background: "#2563EB" }}
                >
                  Recommandé
                </div>
              )}

              {/* Plan Name */}
              <h3 className="mb-2 font-semibold text-xl" style={{ color: "#1A1A1A" }}>
                {plan.name}
              </h3>
              <p className="mb-6 text-sm" style={{ color: "#4A4A4A" }}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                {plan.monthlyPrice ? (
                  <>
                    <span className="font-bold text-4xl" style={{ color: "#1A1A1A" }}>
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}€
                    </span>
                    <span className="text-sm" style={{ color: "#8A8A8A" }}>
                      /mois
                    </span>
                    {isYearly && (
                      <p className="mt-1 text-xs" style={{ color: "#059669" }}>
                        Facturé annuellement
                      </p>
                    )}
                  </>
                ) : (
                  <span className="font-semibold text-2xl" style={{ color: "#1A1A1A" }}>
                    Sur devis
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#059669" }} />
                    <span className="text-sm" style={{ color: "#4A4A4A" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className="block rounded-lg py-3 text-center font-medium transition-all"
                style={{
                  background: plan.popular ? "#2563EB" : "transparent",
                  color: plan.popular ? "#FFFFFF" : "#1A1A1A",
                  border: plan.popular ? "none" : "1px solid #E8E5DF",
                }}
                onMouseEnter={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = "#1d4ed8";
                  } else {
                    e.currentTarget.style.borderColor = "#2563EB";
                    e.currentTarget.style.color = "#2563EB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.popular) {
                    e.currentTarget.style.background = "#2563EB";
                  } else {
                    e.currentTarget.style.borderColor = "#E8E5DF";
                    e.currentTarget.style.color = "#1A1A1A";
                  }
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <p className="text-center text-sm" style={{ color: "#8A8A8A" }}>
          14 jours satisfait ou remboursé · Sans engagement · Données chiffrées · Conforme RGPD
        </p>
      </div>
    </section>
  );
}
