"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { AnimationContainer } from "@/components/global/animation-container";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "C'est quoi exactement DSPilot ? Ca remplace quoi dans mon quotidien ?",
    answer:
      "DSPilot est un outil de gestion dedie aux stations Amazon DSP. Il remplace vos fichiers Excel de suivi des scores DWC et IADC, vos exports manuels, vos reportings bricoles et vos notes de coaching eparpillees. Concretement, tout ce que vous faites aujourd'hui sur tableur pour suivre la performance de vos livreurs, DSPilot le centralise et l'automatise.",
  },
  {
    question: "Je n'ai pas le budget pour un outil a 999 euros par mois.",
    answer:
      "Un DSP genere entre 500 000 et 2 millions d'euros de chiffre d'affaires par an. A 999 euros par mois, DSPilot represente moins de 0.1% de votre CA. En face, il vous fait gagner 3 a 5 heures par semaine — soit l'equivalent de 3 jours de travail par mois. C'est moins cher qu'un livreur a mi-temps, et ca protege directement votre tier Fantastic. Commencez gratuitement avec le plan Starter pour juger par vous-meme.",
  },
  {
    question: "Est-ce que c'est compatible avec les rapports Amazon ?",
    answer:
      "Oui. Vous copiez le tableau de metriques livreurs directement depuis votre interface Amazon, vous le collez dans DSPilot, et les donnees sont extraites automatiquement en 30 secondes. Pas de fichier a reformater, pas de colonne a ajuster. Si Amazon change son format, on met a jour l'import dans la journee.",
  },
  {
    question: "Mes donnees de station sont sensibles. C'est securise ?",
    answer:
      "Absolument. DSPilot utilise une authentification Clerk, un chiffrement TLS de bout en bout, et un hebergement sur Vercel conforme aux standards europeens. Vos donnees de performance livreurs et metriques IADC ne sont jamais partagees ni revendues. Vous restez proprietaire de tout ce que vous importez.",
  },
  {
    question: "Je gere une station en Afrique de l'Ouest, ca fonctionne aussi ?",
    answer:
      "Oui. DSPilot est concu pour les stations Amazon DSP en France et en Afrique de l'Ouest. L'interface est 100% francophone, les metriques sont les memes, et l'acces est 100% web — il suffit d'une connexion internet.",
  },
  {
    question: "Et si Amazon change ses metriques ou son format de rapport ?",
    answer:
      "C'est notre metier de suivre ca. DSPilot est maintenu et mis a jour en continu. Si Amazon modifie le format des scorecards ou ajoute de nouvelles metriques de performance livreurs, nous adaptons l'outil. Vous n'avez rien a faire de votre cote.",
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
        <h2 className="font-bold text-3xl text-foreground tracking-tight md:text-5xl">Questions frequentes</h2>
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
