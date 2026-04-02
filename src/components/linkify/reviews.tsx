"use client";

import { Lock, Shield, User } from "lucide-react";

const trustBlocks = [
  {
    icon: User,
    title: "Né sur le terrain, pas en laboratoire.",
    description:
      "DSPilot a été créé par un manager de station Amazon DSP qui passait ses lundis matin sur Excel. Chaque fonctionnalité répond à un problème vécu, pas à une hypothèse de consultant.",
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
      "Chiffrement TLS, authentification renforcée, hébergement européen. Vos métriques de station et données livreurs sont protégées selon les standards du marché.",
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="py-24" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center" data-scroll-reveal>
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
        <div className="mx-auto max-w-3xl text-center" data-scroll-reveal>
          <p
            className="font-[family-name:var(--font-display)] text-xl italic leading-relaxed md:text-2xl"
            style={{ color: "#4A4A4A" }}
          >
            DSPilot n&apos;est pas sorti d&apos;un brainstorm en salle de réunion. Il est né d&apos;un constat simple :
            un manager de station Amazon DSP en France n&apos;a aucun outil adapté à son métier. Les solutions
            américaines ne parlent pas français, ne comprennent pas les spécificités du marché, et coûtent une fortune.
            Alors on a construit l&apos;outil qu&apos;on aurait voulu avoir dès le premier jour. Chaque écran, chaque
            alerte, chaque rapport a été pensé par quelqu&apos;un qui a vécu le lundi matin à copier-coller des
            scorecards dans Excel. On connaît le métier parce qu&apos;on le fait.
          </p>
        </div>
      </div>
    </section>
  );
}
