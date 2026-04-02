"use client";

import { useState } from "react";

import Link from "next/link";

import { Check, Sparkles } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Gratuit",
    description: "Pour découvrir DSPilot",
    price: { monthly: 0, yearly: 0 },
    features: ["Jusqu'à 20 livreurs", "Dashboard de base", "Import manuel", "7 jours d'historique"],
    cta: "Commencer",
    href: "/sign-up",
  },
  {
    name: "Pro",
    description: "Pour les stations actives",
    price: { monthly: 49, yearly: 39 },
    popular: true,
    features: [
      "Livreurs illimités",
      "Dashboard complet",
      "Import automatisé",
      "Historique illimité",
      "Coaching intégré",
      "Analyse des erreurs",
      "Export PDF/Excel",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    href: "/sign-up?plan=pro",
  },
  {
    name: "Enterprise",
    description: "Pour les réseaux DSP",
    price: { monthly: 149, yearly: 119 },
    features: [
      "Multi-stations",
      "Tout du plan Pro",
      "API personnalisée",
      "SSO / SAML",
      "Account manager dédié",
      "SLA garanti",
    ],
    cta: "Contacter les ventes",
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
          Choisissez votre{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">formule</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Des tarifs transparents, sans surprise. Commencez gratuitement et évoluez selon vos besoins.
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
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 md:p-8",
                plan.popular ? "border-blue-500 bg-blue-500/5" : "border-border/60 bg-background/50",
              )}
            >
              {plan.popular && (
                <div className="-top-3 -translate-x-1/2 absolute left-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 font-medium text-white text-xs">
                    <Sparkles className="size-3" />
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-foreground text-xl">{plan.name}</h3>
                <p className="mt-1 text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-bold text-4xl text-foreground">
                  {isYearly ? plan.price.yearly : plan.price.monthly}€
                </span>
                <span className="text-muted-foreground">/mois</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-blue-500" />
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
    </section>
  );
}
