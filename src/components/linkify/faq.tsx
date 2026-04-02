"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "C'est quoi exactement DSPilot ? Ça remplace quoi dans mon quotidien ?",
    answer:
      "DSPilot est un outil de gestion dédié aux stations Amazon DSP. Il remplace vos fichiers Excel de suivi des scores DWC et IADC, vos exports manuels, vos reportings bricolés et vos notes de coaching éparpillées. Concrètement, tout ce que vous faites aujourd'hui sur tableur pour suivre la performance de vos livreurs, DSPilot le centralise et l'automatise.",
  },
  {
    question: "499 ou 999\u00A0\u20AC par mois, c'est cher. Ça vaut vraiment le coup ?",
    answer:
      "Un DSP génère entre 500\u00A0000 et 2 millions d'euros de chiffre d'affaires par an. À 999\u00A0\u20AC par mois, DSPilot représente moins de 0,1\u00A0% de votre CA. En face, il vous fait gagner 3 à 5 heures par semaine — soit l'équivalent de 3 jours de travail par mois. C'est moins cher qu'un livreur à mi-temps, et ça protège directement votre tier Fantastic. Testez pendant 14 jours, satisfait ou remboursé.",
  },
  {
    question: "Est-ce que c'est compatible avec les rapports Amazon ?",
    answer:
      "Oui. Vous copiez le tableau de métriques livreurs directement depuis votre interface Amazon, vous le collez dans DSPilot, et les données sont extraites automatiquement en 30 secondes. Pas de fichier à reformater, pas de colonne à ajuster. Si Amazon change son format, on met à jour l'import dans la journée.",
  },
  {
    question: "Mes données de station sont sensibles. C'est sécurisé ?",
    answer:
      "Absolument. DSPilot utilise une authentification Clerk, un chiffrement TLS de bout en bout, et un hébergement sur Vercel conforme aux standards européens. Vos données de performance livreurs et métriques IADC ne sont jamais partagées ni revendues. Vous restez propriétaire de tout ce que vous importez.",
  },
  {
    question: "Je peux tester avant de m'engager ?",
    answer:
      "Oui. Le plan Pro est accessible directement, et vous pouvez annuler en un clic à tout moment. Pas de contrat, pas de durée minimum. Vous jugez sur pièce.",
  },
  {
    question: "Et si Amazon change ses métriques ou son format de rapport ?",
    answer:
      "C'est notre métier de suivre ça. DSPilot est maintenu et mis à jour en continu. Si Amazon modifie le format des scorecards ou ajoute de nouvelles métriques de performance livreurs, nous adaptons l'outil. Vous n'avez rien à faire de votre côté.",
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
    <div className="border-b" style={{ borderColor: "#E8E5DF" }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left font-medium text-[17px] transition-colors duration-200"
        style={{ color: "#1A1A1A" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#2563EB";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#1A1A1A";
        }}
      >
        <span className="pr-4">{question}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform duration-300", isOpen && "rotate-180")}
          style={{ color: "#8A8A8A" }}
        />
      </button>
      <div
        className={cn("overflow-hidden transition-all", isOpen ? "max-h-[300px]" : "max-h-0")}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", transitionDuration: "400ms" }}
      >
        <p className="pb-6 text-[15px] leading-[1.8]" style={{ color: "#4A4A4A" }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            FAQ
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Questions fréquentes
          </h2>
        </div>

        <div className="mx-auto max-w-[800px]" data-scroll-reveal>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => {
                setOpenIndex(openIndex === i ? null : i);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
