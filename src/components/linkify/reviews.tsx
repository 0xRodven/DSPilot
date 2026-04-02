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
    <section className="px-6 py-28" style={{ background: "#F5F3EE" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            Confiance
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Conçu par un manager DSP. Pour les managers DSP.
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
