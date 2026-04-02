"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Comment fonctionne l'import des données Amazon ?",
    answer:
      "Il vous suffit de copier-coller le tableau de performance depuis votre portail Amazon DSP. Notre parser intelligent extrait automatiquement toutes les métriques (DWC, IADC, erreurs, etc.) et les organise dans votre dashboard.",
  },
  {
    question: "Puis-je essayer DSPilot gratuitement ?",
    answer:
      "Oui ! Le plan Gratuit vous permet de gérer jusqu'à 20 livreurs avec les fonctionnalités essentielles. Pour le plan Pro, nous offrons un essai gratuit de 14 jours sans engagement.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Nous utilisons un chiffrement de bout en bout et vos données sont hébergées sur des serveurs sécurisés. Nous ne partageons jamais vos données avec des tiers.",
  },
  {
    question: "Puis-je gérer plusieurs stations ?",
    answer:
      "Le plan Enterprise permet de gérer plusieurs stations depuis un seul compte avec des tableaux de bord consolidés et une vue d'ensemble de votre réseau DSP.",
  },
  {
    question: "Proposez-vous une formation ?",
    answer:
      "Oui, nous proposons des sessions de formation personnalisées pour vous aider à tirer le meilleur parti de DSPilot. Le support est inclus dans tous les plans payants.",
  },
  {
    question: "Comment fonctionne le module de coaching ?",
    answer:
      "Le module de coaching vous permet de planifier des sessions avec vos livreurs, de définir des objectifs basés sur leurs métriques et de suivre leur progression. Vous pouvez ajouter des notes, des actions correctives et mesurer l'impact de chaque intervention.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-border/40 border-b">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-4 text-left">
        <span className="font-medium text-base text-foreground">{question}</span>
        <ChevronDown
          className={cn("size-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-96 pb-4" : "max-h-0")}>
        <p className="text-muted-foreground">{answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-32">
      <AnimationContainer className="mb-12 text-center">
        <span className="font-medium text-blue-500 text-sm">FAQ</span>
        <h2 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
          Questions{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">fréquentes</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Tout ce que vous devez savoir sur DSPilot.
        </p>
      </AnimationContainer>

      <AnimationContainer delay={0.1}>
        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </AnimationContainer>
    </section>
  );
}
