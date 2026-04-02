"use client";

import { AlertTriangle, BarChart3, Calendar, Clock, FileSpreadsheet, FileUp, Users } from "lucide-react";

import { BrowserFrame } from "./browser-frame";
import { CoachingMockup, DriverMockup, ImportMockup, ReportMockup } from "./mockups";

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

const features = [
  {
    icon: FileUp,
    label: "Import",
    title: "30 secondes. Pas 3 heures.",
    description:
      "Copiez le tableau Amazon, collez dans DSPilot. Les métriques sont extraites, nettoyées et classées automatiquement. Votre lundi matin redevient un jour de management, pas de saisie.",
    mockup: ImportMockup,
    imagePosition: "right" as const,
  },
  {
    icon: Calendar,
    label: "Coaching",
    title: "Chaque livreur en difficulté a un plan d'action.",
    description:
      "Un Kanban dédié — Détection, Attente, Évaluation, Terminé — avec pipeline d'escalade et calendrier de rendez-vous intégré. Vous ne laissez plus personne passer entre les mailles du filet.",
    mockup: CoachingMockup,
    imagePosition: "left" as const,
  },
  {
    icon: Users,
    label: "Suivi individuel",
    title: "Chaque livreur reçoit son propre bilan.",
    description:
      "Rapports individuels avec analyse personnalisée de ses métriques, points forts, axes d'amélioration. Le livreur sait exactement où il en est — et vous n'avez rien eu à rédiger.",
    mockup: DriverMockup,
    imagePosition: "right" as const,
  },
  {
    icon: BarChart3,
    label: "Rapports",
    title: "Le rapport du lundi ? Il est déjà prêt.",
    description:
      "Chaque semaine, DSPilot génère un rapport professionnel prêt à envoyer et envoie les récaps individuels par WhatsApp à chaque livreur. Vos interlocuteurs Amazon reçoivent un document propre ; vos livreurs reçoivent leur feuille de route.",
    mockup: ReportMockup,
    imagePosition: "left" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      {/* Pain Points Section */}
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Label */}
        <div data-scroll-reveal>
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#DC2626" }}>
            Le problème
          </div>

          {/* Title */}
          <h2
            className="mb-12 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Votre lundi matin ressemble à ça.
          </h2>
        </div>

        {/* Pain Point Cards */}
        <div className="mb-32 grid gap-6 md:grid-cols-3">
          {painPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="group rounded-xl border border-[#E8E5DF] bg-white p-6 transition-all hover:border-red-500 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-lg p-3" style={{ background: "#FEF2F2" }}>
                  <Icon className="h-6 w-6" style={{ color: "#DC2626" }} />
                </div>
                <h3 className="mb-2 font-semibold text-lg" style={{ color: "#1A1A1A" }}>
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Solution Section */}
        <div data-scroll-reveal>
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#2563EB" }}>
            La solution
          </div>

          <h2
            className="mb-16 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Un dashboard conçu pour les station managers.
          </h2>
        </div>

        {/* Feature Rows */}
        <div className="space-y-24">
          {features.map((feature) => {
            const Icon = feature.icon;
            const Mockup = feature.mockup;
            const isImageRight = feature.imagePosition === "right";

            return (
              <div
                key={feature.title}
                data-scroll-reveal
                className={`flex flex-col items-center gap-12 lg:flex-row ${isImageRight ? "" : "lg:flex-row-reverse"}`}
              >
                {/* Text Content */}
                <div className="flex-1 lg:max-w-md">
                  <div
                    className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
                    style={{ background: "#EFF6FF" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#2563EB" }} />
                    <span className="font-medium text-sm" style={{ color: "#2563EB" }}>
                      {feature.label}
                    </span>
                  </div>
                  <h3
                    className="mb-4 font-[family-name:var(--font-display)] text-3xl leading-tight"
                    style={{ color: "#1A1A1A" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-lg leading-relaxed" style={{ color: "#4A4A4A" }}>
                    {feature.description}
                  </p>
                </div>

                {/* Mockup */}
                <div className="flex-1">
                  <BrowserFrame url={`app.dspilot.fr/${feature.label.toLowerCase()}`}>
                    <Mockup />
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
