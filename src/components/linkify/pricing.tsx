"use client";

import { useState } from "react";

import Link from "next/link";

import { Check, Shield, Sparkles } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    tagline: "Testez DSPilot sans engagement sur votre station.",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Jusqu'à 20 livreurs",
      "Dashboard métriques essentielles",
      "Import manuel",
      "Historique 4 semaines",
    ],
    cta: "Commencer gratuitement",
    href: "/sign-up",
  },
  {
    name: "Pro",
    tagline: "Le tableau de bord complet pour piloter votre station au quotidien.",
    price: { monthly: 499, yearly: 399 },
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
    href: "/sign-up?plan=pro",
  },
  {
    name: "Business",
    tagline: "Performance, coaching et rapports — sans friction.",
    price: { monthly: 999, yearly: 799 },
    popular: true,
    features: [
      "Tout Pro +",
      "Coaching intégré (Kanban, escalade, calendrier)",
      "Rapports individuels par livreur",
      "Récaps WhatsApp hebdomadaires",
      "Rapports consulting-grade auto",
      "Accès API",
      "Support prioritaire",
    ],
    cta: "Choisir Business",
    href: "/sign-up?plan=business",
  },
  {
    name: "Enterprise",
    tagline: "Pour les groupes multi-stations qui veulent un partenaire, pas un outil.",
    price: { monthly: null, yearly: null },
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
    href: "mailto:sales@dspilot.fr",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <span className="font-medium text-blue-500 text-sm">Tarifs</span>
        <h2 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
          Un abonnement qui se rembourse{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            dès la première semaine
          </span>
          .
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
          DSPilot vous fait gagner 3 à 5 heures par semaine. À l'échelle d'un mois, c'est l'équivalent de 3 jours de
          travail récupérés.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className={cn("text-sm", !isYearly && "font-medium text-foreground")}>Mensuel</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
              isYearly ? "bg-blue-500" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition duration-200 ease-in-out",
                isYearly ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
          <span className={cn("text-sm", isYearly && "font-medium text-foreground")}>
            Annuel
            <span className="ml-1 text-blue-500 text-xs">-20%</span>
          </span>
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                plan.popular ? "border-blue-500 bg-blue-500/5" : "border-border/60 bg-background/50",
              )}
            >
              {plan.popular && (
                <div className="-top-3 -translate-x-1/2 absolute left-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 font-medium text-white text-xs">
                    <Sparkles className="size-3" />
                    Recommandé
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-foreground text-xl">{plan.name}</h3>
                <p className="mt-1 min-h-[40px] text-muted-foreground text-sm">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                {plan.price.monthly !== null ? (
                  <>
                    <span className="font-bold text-4xl text-foreground">
                      {isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">{plan.price.monthly === 0 ? "" : "\u20AC/mois"}</span>
                  </>
                ) : (
                  <span className="font-bold text-2xl text-foreground">Sur devis</span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-blue-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className={cn("w-full", plan.popular && "bg-blue-500 hover:bg-blue-600")}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </AnimationContainer>

      {/* Reassurance */}
      <AnimationContainer delay={0.2}>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5">
            <Shield className="size-4" />
            Sans engagement
          </span>
          <span className="text-border">|</span>
          <span>Données chiffrées TLS</span>
          <span className="text-border">|</span>
          <span>Annulation en un clic</span>
          <span className="text-border">|</span>
          <span>Conforme RGPD</span>
        </div>
      </AnimationContainer>
    </section>
  );
}
