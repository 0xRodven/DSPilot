"use client";

import { Check, X } from "lucide-react";

const comparisons = [
  {
    before: "Télécharger les fichiers Amazon, ouvrir Excel, copier-coller, formater...",
    after: "Un copier-coller, 30 secondes, c'est importé.",
  },
  {
    before: "Chercher qui a des mauvais scores, noter sur un post-it, espérer ne pas oublier.",
    after: "Alertes automatiques, actions de coaching suggérées, historique complet.",
  },
  {
    before: "Refaire les mêmes graphiques chaque semaine. À la main.",
    after: "Rapport automatique chaque lundi. Prêt à envoyer.",
  },
  {
    before: "Un fichier Excel partagé qui plante quand deux personnes l'ouvrent.",
    after: "Une app web temps réel. PDF professionnel en un clic.",
  },
  {
    before: "Amazon demande des preuves de coaching ? Bonne chance.",
    after: "Tout est tracé, daté, exportable. Vous êtes couvert.",
  },
];

export function Process() {
  return (
    <section id="process" className="py-24" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-5xl px-6">
        {/* Section Label */}
        <div className="text-center">
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#2563EB" }}>
            Comment ça marche
          </div>

          <h2
            className="mb-16 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Avant DSPilot vs. Avec DSPilot.
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E8E5DF" }}>
          {/* Headers */}
          <div className="grid grid-cols-2" style={{ borderBottom: "1px solid #E8E5DF" }}>
            <div className="px-6 py-4 text-center font-semibold" style={{ color: "#DC2626", background: "#FEF2F2" }}>
              Avant DSPilot
            </div>
            <div className="px-6 py-4 text-center font-semibold" style={{ color: "#059669", background: "#ECFDF5" }}>
              Avec DSPilot
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="grid grid-cols-2"
              style={{
                borderBottom: index < comparisons.length - 1 ? "1px solid #E8E5DF" : "none",
              }}
            >
              {/* Before */}
              <div className="flex items-start gap-3 p-6" style={{ borderLeft: "3px solid #DC2626" }}>
                <X className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#DC2626" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
                  {comparison.before}
                </p>
              </div>

              {/* After */}
              <div className="flex items-start gap-3 p-6" style={{ borderLeft: "3px solid #059669" }}>
                <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#059669" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
                  {comparison.after}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
