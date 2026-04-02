"use client";

import { Star } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { MagicCard } from "@/components/ui/magic-card";

const reviews = [
  {
    name: "Mamadou Diallo",
    role: "DSP Manager, Dakar",
    avatar: "MD",
    rating: 5,
    content:
      "DSPilot a transformé notre façon de gérer notre station. Les métriques sont claires et le coaching est beaucoup plus efficace.",
  },
  {
    name: "Aissatou Ba",
    role: "Operations Lead, Thiès",
    avatar: "AB",
    rating: 5,
    content:
      "L'import automatique nous fait gagner des heures chaque semaine. L'analyse des erreurs nous a permis de réduire nos incidents de 40%.",
  },
  {
    name: "Ousmane Sow",
    role: "DSP Owner, Saint-Louis",
    avatar: "OS",
    rating: 5,
    content:
      "Enfin un outil pensé pour les DSP africaines. Le support est réactif et les fonctionnalités correspondent exactement à nos besoins.",
  },
  {
    name: "Fatou Ndiaye",
    role: "Performance Coach, Mbour",
    avatar: "FN",
    rating: 5,
    content:
      "Le module de coaching est un game-changer. Je peux suivre chaque livreur et voir l'impact réel de mes sessions.",
  },
  {
    name: "Ibrahima Fall",
    role: "Fleet Manager, Rufisque",
    avatar: "IF",
    rating: 5,
    content:
      "L'interface est intuitive et les graphiques sont parfaits pour présenter les résultats lors de nos réunions hebdomadaires.",
  },
  {
    name: "Mariama Sy",
    role: "DSP Manager, Kaolack",
    avatar: "MS",
    rating: 5,
    content:
      "Notre score IADC a augmenté de 3 points depuis qu'on utilise DSPilot. L'investissement est largement rentabilisé.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
      ))}
    </div>
  );
}

export function Reviews() {
  return (
    <section className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <span className="font-medium text-blue-500 text-sm">Témoignages</span>
        <h2 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
          Ils nous font{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">confiance</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Découvrez ce que nos clients disent de DSPilot.
        </p>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <MagicCard key={i} className="flex flex-col gap-4">
              <StarRating rating={review.rating} />
              <p className="flex-1 text-muted-foreground">{review.content}</p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 font-medium text-blue-400 text-sm">
                  {review.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{review.name}</p>
                  <p className="text-muted-foreground text-xs">{review.role}</p>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>
      </AnimationContainer>
    </section>
  );
}
