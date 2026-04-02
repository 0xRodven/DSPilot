"use client";

import { Lock, Shield, User } from "lucide-react";

const trustBlocks = [
  {
    icon: User,
    title: "Né sur le terrain, pas en laboratoire.",
    description:
      "DSPilot a été créé par un manager DSP, pour résoudre ses propres problèmes. Chaque fonctionnalité existe parce qu'elle répond à un vrai besoin du quotidien — pas parce qu'elle a l'air cool sur une démo.",
  },
  {
    icon: Shield,
    title: "Rapide, stable, toujours à jour.",
    description:
      "DSPilot tourne sur une infrastructure de niveau entreprise : temps réel, mises à jour sans interruption, disponibilité permanente. Ce n'est pas un fichier partagé qui plante quand deux personnes l'ouvrent en même temps.",
  },
  {
    icon: Lock,
    title: "Vos données ne quittent jamais l'infrastructure sécurisée.",
    description:
      "Hébergement européen, chiffrement de bout en bout, accès strictement limité. Vos données de performance restent les vôtres — pas de revente, pas de partage, jamais.",
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="py-24" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#2563EB" }}>
            Pourquoi nous faire confiance
          </div>
          <h2
            className="font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Conçu par un manager DSP.
            <br />
            Pour les managers DSP.
          </h2>
        </div>

        {/* Trust Blocks */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {trustBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                className="rounded-xl p-6"
                style={{ background: "#FFFFFF", border: "1px solid #E8E5DF" }}
              >
                <div className="mb-4 inline-flex rounded-lg p-3" style={{ background: "#EFF6FF" }}>
                  <Icon className="h-6 w-6" style={{ color: "#2563EB" }} />
                </div>
                <h3 className="mb-3 font-semibold text-lg" style={{ color: "#1A1A1A" }}>
                  {block.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
                  {block.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Narrative */}
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="font-[family-name:var(--font-display)] text-xl italic leading-relaxed md:text-2xl"
            style={{ color: "#4A4A4A" }}
          >
            &ldquo;J&apos;ai passé des années à jongler entre Excel, les emails d&apos;Amazon et les post-it de
            coaching. Un jour, j&apos;ai décidé de construire l&apos;outil que j&apos;aurais aimé avoir dès le premier
            jour. DSPilot, c&apos;est ça : tout ce que j&apos;ai appris sur le terrain, automatisé.&rdquo;
          </p>
          <p className="mt-6 font-medium text-sm" style={{ color: "#1A1A1A" }}>
            — Ousmane, fondateur de DSPilot
          </p>
        </div>
      </div>
    </section>
  );
}
