"use client";

import { Lock, Shield, User } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { MagicCard } from "@/components/ui/magic-card";

const trustBlocks = [
  {
    icon: User,
    title: "Ne sur le terrain, pas en laboratoire.",
    description:
      "DSPilot a ete cree par un manager de station Amazon DSP qui passait ses lundis matin sur Excel. Chaque fonctionnalite repond a un probleme vecu, pas a une hypothese de consultant.",
  },
  {
    icon: Shield,
    title: "Construit sur les memes technologies que Netflix et Stripe.",
    description:
      "Next.js, React 19, base de donnees temps reel Convex, authentification Clerk, hebergement Vercel. Une infrastructure de niveau entreprise — pas un prototype sur Google Sheets.",
  },
  {
    icon: Lock,
    title: "Vos donnees ne quittent jamais l'infrastructure securisee.",
    description:
      "Chiffrement TLS, authentification renforcee, hebergement europeen. Vos metriques de station et donnees livreurs sont protegees selon les standards du marche.",
  },
];

export function Reviews() {
  return (
    <section className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <h2 className="font-bold text-3xl text-foreground tracking-tight md:text-5xl">
          Concu par un manager DSP.
        </h2>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          {trustBlocks.map((block, i) => (
            <MagicCard key={i} className="flex flex-col gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                <block.icon className="size-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">{block.title}</h3>
              <p className="text-muted-foreground">{block.description}</p>
            </MagicCard>
          ))}
        </div>
      </AnimationContainer>

      <AnimationContainer delay={0.2}>
        <p className="mx-auto mt-12 max-w-3xl text-center text-muted-foreground italic">
          DSPilot n'est pas sorti d'un brainstorm en salle de reunion. Il est ne d'un constat simple : un
          manager de station Amazon DSP en France n'a aucun outil adapte a son metier. Les solutions
          americaines ne parlent pas francais, ne comprennent pas les specificites du marche, et coutent une
          fortune. Alors on a construit l'outil qu'on aurait voulu avoir des le premier jour. Chaque ecran,
          chaque alerte, chaque rapport a ete pense par quelqu'un qui a vecu le lundi matin a copier-coller des
          scorecards dans Excel. On connait le metier parce qu'on le fait.
        </p>
      </AnimationContainer>
    </section>
  );
}
