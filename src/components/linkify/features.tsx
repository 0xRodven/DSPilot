"use client";

import { AlertTriangle, BarChart3, Calendar, FileUp, LineChart, Users } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    name: "Dashboard temps réel",
    description:
      "Visualisez les performances DWC et IADC de votre station en un coup d'œil avec des métriques actualisées.",
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
    name: "Analyse des erreurs",
    description: "Identifiez les erreurs récurrentes et leurs causes pour améliorer la qualité des livraisons.",
    icon: <AlertTriangle className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <LineChart className="size-32 text-blue-500" />
      </div>
    ),
  },
  {
    name: "Coaching intelligent",
    description: "Planifiez des sessions de coaching ciblées basées sur les données de performance.",
    icon: <Calendar className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <Calendar className="size-32 text-blue-500" />
      </div>
    ),
  },
  {
    name: "Suivi des livreurs",
    description: "Suivez l'évolution de chaque livreur avec des profils détaillés et un historique complet.",
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
    name: "Import automatisé",
    description:
      "Importez facilement les rapports Amazon avec notre parser intelligent qui extrait automatiquement les données.",
    icon: <FileUp className="size-5" />,
    className: "md:col-span-1",
    background: (
      <div className="absolute top-4 right-4 opacity-20">
        <FileUp className="size-32 text-blue-500" />
      </div>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32">
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
