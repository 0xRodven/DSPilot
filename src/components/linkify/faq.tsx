"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "C'est quoi exactement, DSPilot ?",
    answer:
      "DSPilot est une application web qui centralise toutes vos données de performance Amazon (DWC, IADC, scorecard) et vous aide à piloter votre station : dashboard en temps réel, alertes automatiques, coaching livreurs, rapports hebdomadaires. Tout ce que vous faites aujourd'hui dans Excel, mais en 10x plus rapide et sans erreur.",
  },
  {
    question: "499 ou 999 € par mois, c'est cher. Ça vaut vraiment le coup ?",
    answer:
      "Faites le calcul : si vous passez 5 heures par semaine sur Excel et les rapports, c'est 20 heures par mois. À 50€/h de votre temps (estimation basse), ça fait 1000€. DSPilot vous rend ces heures — et vous évite les erreurs qui coûtent des primes. Testez pendant 14 jours, satisfait ou remboursé.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Oui. Hébergement en Europe, chiffrement AES-256 au repos et en transit, authentification sécurisée via Clerk, accès strictement limité. Vos données ne sont jamais revendues ni partagées. Nous sommes conformes RGPD.",
  },
  {
    question: "Comment fonctionne l'import des données ?",
    answer:
      "Vous copiez-collez le tableau HTML depuis votre page Amazon Logistics (Scorecard, DWC, IADC). DSPilot parse automatiquement les données, les valide et vous montre immédiatement s'il y a des erreurs ou des anomalies. 30 secondes chrono.",
  },
  {
    question: "Je peux tester avant de m'engager ?",
    answer:
      "Oui. Le plan Pro est accessible directement, et vous pouvez annuler en un clic à tout moment. Pas de contrat, pas de durée minimum. Vous jugez sur pièce.",
  },
  {
    question: "Et si j'ai besoin d'aide ?",
    answer:
      "Support par email inclus dans tous les plans (prioritaire pour Business et Enterprise). Nous proposons aussi des sessions de formation pour vous aider à tirer le maximum de DSPilot. Et si vous avez une demande spécifique, on en discute.",
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
