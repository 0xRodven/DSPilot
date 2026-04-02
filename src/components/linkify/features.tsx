"use client";

import { AlertTriangle, BarChart3, Calendar, Clock, FileSpreadsheet, FileUp, Users } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { MagicCard } from "@/components/ui/magic-card";

const painPoints = [
  {
    icon: <Clock className="size-8 text-blue-500" />,
    title: "5 heures par semaine dans Excel. Chaque semaine.",
    description:
      "Copier les scorecards Amazon, coller dans un tableur, reformater, croiser les données, préparer le reporting. Vous ne managez plus votre station — vous faites de la saisie.",
  },
  {
    icon: <AlertTriangle className="size-8 text-blue-500" />,
    title: "Un livreur décroche. Vous le voyez trop tard.",
    description:
      "Sans vue centralisée, un score DWC qui chute passe inaperçu pendant deux, trois semaines. Le temps de réagir, c'est le tier de toute la station qui en pâtit.",
  },
  {
    icon: <FileSpreadsheet className="size-8 text-blue-500" />,
    title: "Du coaching sur post-it, des résultats sur papier.",
    description:
      "Vous savez qui coacher. Mais entre les notes volantes, les messages WhatsApp éparpillés et les réunions non suivies, rien n'est structuré. Le même livreur repasse en rouge le mois suivant.",
  },
];

const features = [
  {
    name: "Toute votre station en un coup d'œil.",
    description:
      "Scores DWC, IADC, répartition par tier, tendances sur 8 semaines — visualisez la performance de chaque livreur sans ouvrir un seul fichier Excel. Vous identifiez les urgences en 10 secondes, pas en 2 heures.",
    icon: <BarChart3 className="size-5" />,
    className: "md:col-span-2",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="grid grid-cols-4 gap-2 p-8">
          {[0.6, 0.8, 0.7, 0.9, 0.65, 0.85, 0.75, 0.55, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8, 0.65, 0.75].map((opacity, i) => (
            <div key={i} className="h-8 w-8 rounded bg-blue-500/20" style={{ opacity }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "30 secondes. Pas 3 heures.",
    description:
      "Copiez le tableau Amazon, collez dans DSPilot. Les métriques sont extraites, nettoyées et classées automatiquement. Votre lundi matin redevient un jour de management, pas de saisie.",
    icon: <FileUp className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <FileUp className="size-32 text-blue-500" />
      </div>
    ),
  },
  {
    name: "Chaque livreur en difficulté a un plan d'action.",
    description:
      "Un Kanban dédié — Détection, Attente, Évaluation, Terminé — avec pipeline d'escalade et calendrier de rendez-vous intégré. Vous ne laissez plus personne passer entre les mailles du filet.",
    icon: <Calendar className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <Calendar className="size-32 text-blue-500" />
      </div>
    ),
  },
  {
    name: "Chaque livreur reçoit son propre bilan.",
    description:
      "Rapports individuels avec analyse personnalisée de ses métriques, points forts, axes d'amélioration. Le livreur sait exactement où il en est — et vous n'avez rien eu à rédiger.",
    icon: <Users className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute inset-0 flex items-end justify-center opacity-20">
        <div className="flex gap-1 p-4">
          {[40, 60, 80, 70, 90, 85, 95].map((h, i) => (
            <div key={i} className="w-4 rounded-t bg-blue-500" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "Le rapport du lundi ? Il est déjà prêt.",
    description:
      "Chaque semaine, DSPilot génère un rapport consulting-grade et envoie les récaps individuels par WhatsApp à chaque livreur.",
    icon: <BarChart3 className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <BarChart3 className="size-32 text-blue-500" />
      </div>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32">
      {/* Pain Points Section */}
      <AnimationContainer className="mb-20">
        <h2 className="mb-12 text-center font-bold text-3xl text-foreground tracking-tight md:text-5xl">
          Votre lundi matin ressemble à ça.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {painPoints.map((pain, i) => (
            <MagicCard key={i} className="flex flex-col gap-4">
              <div className="flex size-14 items-center justify-center rounded-lg bg-blue-500/10">
                {pain.icon}
              </div>
              <h3 className="font-semibold text-foreground text-lg">{pain.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pain.description}</p>
            </MagicCard>
          ))}
        </div>
      </AnimationContainer>

      {/* Features Section */}
      <AnimationContainer className="mb-12 text-center">
        <span className="font-medium text-blue-500 text-sm">Fonctionnalités</span>
        <h2 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
          Tout ce dont vous avez besoin pour{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">exceller</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          DSPilot vous offre tous les outils nécessaires pour optimiser les performances de votre station DSP Amazon.
        </p>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <BentoGrid>
          {features.map((feature, i) => (
            <BentoCard key={i} {...feature} />
          ))}
        </BentoGrid>
      </AnimationContainer>
    </section>
  );
}
