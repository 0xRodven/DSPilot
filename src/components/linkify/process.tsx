"use client";

import { Check, X } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";

const comparisons = [
  {
    before: "3 heures de copier-coller chaque lundi",
    after: "Import en 30 secondes, données prêtes à l'analyse",
  },
  {
    before: "Un livreur chute, vous le découvrez au reporting mensuel",
    after: "Alerte dès que le score DWC passe sous le seuil",
  },
  {
    before: "Coaching au feeling, sans suivi structuré",
    after: "Kanban avec pipeline d'escalade et historique complet",
  },
  {
    before: "Reporting Amazon bricolé sur Excel chaque semaine",
    after: "PDF consulting-grade généré automatiquement",
  },
  {
    before: "Chaque livreur demande où il en est — vous cherchez dans vos fichiers",
    after: "Rapport individuel envoyé par WhatsApp, sans intervention",
  },
];

export function Process() {
  return (
    <section id="process" className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <h2 className="font-bold text-3xl text-foreground tracking-tight md:text-5xl">
          Avant DSPilot vs. Avec DSPilot.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Ce qui change concrètement dans votre semaine.
        </p>
      </AnimationContainer>

      <div className="mx-auto max-w-5xl">
        {/* Headers */}
        <AnimationContainer delay={0.1}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-t-lg bg-red-500/10 px-4 py-3 text-center">
              <span className="font-semibold text-red-500">Avant DSPilot</span>
            </div>
            <div className="rounded-t-lg bg-blue-500/10 px-4 py-3 text-center">
              <span className="font-semibold text-blue-500">Avec DSPilot</span>
            </div>
          </div>
        </AnimationContainer>

        {/* Comparison rows */}
        <div className="space-y-3">
          {comparisons.map((item, i) => (
            <AnimationContainer key={i} delay={0.15 + i * 0.05}>
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div className="flex items-start gap-3 rounded-lg border-l-2 border-red-500/30 bg-red-500/5 p-4">
                  <X className="mt-0.5 size-5 shrink-0 text-red-500" />
                  <p className="text-muted-foreground text-sm md:text-base">{item.before}</p>
                </div>
                {/* After */}
                <div className="flex items-start gap-3 rounded-lg border-l-2 border-blue-500/30 bg-blue-500/5 p-4">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <p className="text-foreground text-sm md:text-base">{item.after}</p>
                </div>
              </div>
            </AnimationContainer>
          ))}
        </div>
      </div>
    </section>
  );
}
