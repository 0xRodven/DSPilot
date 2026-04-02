"use client";

import { AlertTriangle, BarChart3, Calendar, Clock, FileSpreadsheet, FileUp, Users } from "lucide-react";

import { BrowserFrame } from "@/components/linkify/browser-frame";
import { CoachingMockup, DriverMockup, ImportMockup, ReportMockup } from "@/components/linkify/mockups";

const painPoints = [
  {
    icon: Clock,
    title: "5 heures par semaine dans Excel. Chaque semaine.",
    description:
      "Copier les scorecards Amazon, coller dans un tableur, reformater, croiser les données, préparer le reporting. Vous ne managez plus votre station — vous faites de la saisie.",
  },
  {
    icon: AlertTriangle,
    title: "Un livreur décroche. Vous le voyez trop tard.",
    description:
      "Sans vue centralisée, un score DWC qui chute passe inaperçu pendant deux, trois semaines. Le temps de réagir, c'est le tier de toute la station qui trinque.",
  },
  {
    icon: FileSpreadsheet,
    title: "Du coaching sur post-it, des résultats sur papier.",
    description:
      "Vous savez qui coacher. Mais entre les notes volantes, les messages WhatsApp éparpillés et les réunions non suivies, rien n'est structuré. Le même livreur repasse en rouge le mois suivant.",
  },
];

const featuresSections = [
  {
    icon: FileUp,
    label: "Import",
    title: "30 secondes. Pas 3 heures.",
    description:
      "Copiez le tableau Amazon, collez dans DSPilot. Les métriques sont extraites, nettoyées et classées automatiquement. Votre lundi matin redevient un jour de management, pas de saisie.",
    mockup: ImportMockup,
    url: "app.dspilot.fr/dashboard/import",
    imageRight: true,
  },
  {
    icon: Calendar,
    label: "Coaching",
    title: "Chaque livreur en difficulté a un plan d'action.",
    description:
      "Un Kanban dédié — Détection, Attente, Évaluation, Terminé — avec pipeline d'escalade et calendrier de rendez-vous intégré. Vous ne laissez plus personne passer entre les mailles du filet.",
    mockup: CoachingMockup,
    url: "app.dspilot.fr/dashboard/coaching",
    imageRight: false,
  },
  {
    icon: Users,
    label: "Suivi individuel",
    title: "Chaque livreur reçoit son propre bilan.",
    description:
      "Rapports individuels avec analyse personnalisée de ses métriques, points forts, axes d'amélioration. Le livreur sait exactement où il en est — et vous n'avez rien eu à rédiger.",
    mockup: DriverMockup,
    url: "app.dspilot.fr/dashboard/drivers/amadou-d",
    imageRight: true,
  },
  {
    icon: BarChart3,
    label: "Rapports",
    title: "Le rapport du lundi ? Il est déjà prêt.",
    description:
      "Chaque semaine, DSPilot génère un rapport professionnel prêt à envoyer et envoie les récaps individuels par WhatsApp à chaque livreur. Vos interlocuteurs Amazon reçoivent un document propre ; vos livreurs reçoivent leur feuille de route.",
    mockup: ReportMockup,
    url: "app.dspilot.fr/dashboard/reports",
    imageRight: false,
  },
];

export function Features() {
  return (
    <section id="features" className="px-6">
      {/* Pain Points */}
      <div className="mx-auto max-w-[1200px] pt-28 pb-20">
        <div data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#DC2626" }}>
            Le problème
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Votre lundi matin
            <br />
            ressemble à ça.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {painPoints.map((pain, i) => (
            <div
              key={i}
              data-scroll-reveal
              data-scroll-delay={String(i * 0.1)}
              className="group rounded-xl border border-[#E8E5DF] bg-white p-8 transition-all duration-300 hover:border-red-500 hover:shadow-lg"
            >
              <div
                className="mb-5 flex size-11 items-center justify-center rounded-xl"
                style={{ background: "#FEF2F2", color: "#DC2626" }}
              >
                <pain.icon className="size-5" />
              </div>
              <h3
                className="mb-3 font-[family-name:var(--font-display)] text-[22px] leading-[1.3]"
                style={{ color: "#1A1A1A" }}
              >
                {pain.title}
              </h3>
              <p className="text-[15px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
                {pain.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features — alternating text/image sections */}
      <div className="mx-auto max-w-[1200px] pt-12 pb-28">
        <div className="mb-16 text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            La solution
          </p>
          <h2
            className="font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Un dashboard conçu pour
            <br />
            les station managers.
          </h2>
        </div>

        <div className="space-y-24">
          {featuresSections.map((feature, i) => {
            const MockupComponent = feature.mockup;
            return (
              <div
                key={i}
                className={`grid items-center gap-12 md:grid-cols-2 lg:gap-20 ${
                  feature.imageRight ? "" : "md:direction-rtl"
                }`}
                data-scroll-reveal
              >
                {/* Text */}
                <div className={feature.imageRight ? "md:order-1" : "md:order-2"}>
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{ background: "#EFF6FF", color: "#2563EB" }}
                    >
                      <feature.icon className="size-4" />
                    </div>
                    <span className="font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
                      {feature.label}
                    </span>
                  </div>

                  <h3
                    className="mb-4 font-[family-name:var(--font-display)] text-[32px] leading-[1.2] tracking-[-0.02em]"
                    style={{ color: "#1A1A1A" }}
                  >
                    {feature.title}
                  </h3>

                  <p className="text-[16px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
                    {feature.description}
                  </p>
                </div>

                {/* Product image in browser frame */}
                <div className={feature.imageRight ? "md:order-2" : "md:order-1"}>
                  <BrowserFrame url={feature.url} perspective={false}>
                    <MockupComponent />
                  </BrowserFrame>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
