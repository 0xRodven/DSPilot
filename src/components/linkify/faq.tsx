"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

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

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#2563EB" }}>
            FAQ
          </div>
          <h2
            className="font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl"
            style={{ color: "#1A1A1A" }}
          >
            Questions fréquentes
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl transition-all"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E5DF",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenIndex(openIndex === index ? null : index);
                }}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="pr-4 font-medium" style={{ color: "#1A1A1A" }}>
                  {faq.question}
                </span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 transition-transform"
                  style={{
                    color: "#8A8A8A",
                    transform: openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6" style={{ borderTop: "1px solid #E8E5DF" }}>
                  <p className="pt-4 leading-relaxed" style={{ color: "#4A4A4A" }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
