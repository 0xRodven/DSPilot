"use client";

import { BarChart3, FileUp, MessageSquare } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { MagicCard } from "@/components/ui/magic-card";

const steps = [
  {
    step: "01",
    icon: <FileUp className="size-6" />,
    title: "Importez vos données",
    description:
      "Copiez-collez simplement le tableau de performance Amazon. Notre parser extrait automatiquement toutes les métriques.",
  },
  {
    step: "02",
    icon: <BarChart3 className="size-6" />,
    title: "Analysez les performances",
    description:
      "Visualisez les scores DWC et IADC, identifiez les tendances et comprenez les forces et faiblesses de chaque livreur.",
  },
  {
    step: "03",
    icon: <MessageSquare className="size-6" />,
    title: "Coachez vos livreurs",
    description:
      "Planifiez des sessions de coaching ciblées, suivez les actions et mesurez l'amélioration dans le temps.",
  },
];

export function Process() {
  return (
    <section className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <span className="font-medium text-blue-500 text-sm">Comment ça marche</span>
        <h2 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
          Simple comme{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">1, 2, 3</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Commencez à optimiser les performances de votre station en quelques minutes.
        </p>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <MagicCard key={i} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-4xl text-blue-500/20">{step.step}</span>
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-semibold text-foreground text-xl">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </MagicCard>
          ))}
        </div>
      </AnimationContainer>
    </section>
  );
}
