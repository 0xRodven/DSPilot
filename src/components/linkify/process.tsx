"use client";

import { Check, X } from "lucide-react";

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
    after: "PDF professionnel généré automatiquement",
  },
  {
    before: "Chaque livreur demande où il en est — vous cherchez dans vos fichiers",
    after: "Rapport individuel envoyé par WhatsApp, sans intervention",
  },
];

export function Process() {
  return (
    <section id="process" className="px-6 py-28" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            Comment ça marche
          </p>
          <h2
            className="mb-4 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Avant DSPilot vs.
            <br />
            Avec DSPilot.
          </h2>
          <p className="mb-12 text-base" style={{ color: "#8A8A8A" }}>
            Ce qui change concrètement dans votre semaine.
          </p>
        </div>

        <div className="mx-auto max-w-[900px]">
          {/* Headers */}
          <div className="mb-1 grid grid-cols-1 gap-0.5 md:grid-cols-2" data-scroll-reveal>
            <div className="px-6 py-3">
              <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#DC2626" }}>
                Avant DSPilot
              </span>
            </div>
            <div className="px-6 py-3">
              <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#059669" }}>
                Avec DSPilot
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-0.5">
            {comparisons.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-0.5 md:grid-cols-2"
                data-scroll-reveal
                data-scroll-delay={String(i * 0.08)}
              >
                <div
                  className="flex items-start gap-3 border-l-[3px] px-6 py-5"
                  style={{
                    background: "#FFFFFF",
                    borderLeftColor: "#DC2626",
                    color: "#4A4A4A",
                  }}
                >
                  <X className="mt-0.5 size-4 shrink-0" style={{ color: "#DC2626" }} />
                  <p className="text-[15px] leading-relaxed">{item.before}</p>
                </div>
                <div
                  className="flex items-start gap-3 border-l-[3px] px-6 py-5"
                  style={{
                    background: "#FFFFFF",
                    borderLeftColor: "#059669",
                    color: "#1A1A1A",
                  }}
                >
                  <Check className="mt-0.5 size-4 shrink-0" style={{ color: "#059669" }} />
                  <p className="text-[15px] leading-relaxed">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
