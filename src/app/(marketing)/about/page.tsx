import Link from "next/link";

import { ArrowLeft, Building2, Target, Users, Zap } from "lucide-react";
import type { Metadata } from "next";

import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";

export const metadata: Metadata = {
  title: "A propos - DSPilot",
  description:
    "DSPilot est un SaaS B2B pour managers de stations Amazon DSP en France. Notre mission : aider les DSP managers a gagner 3h/semaine.",
};

export default function AboutPage() {
  return (
    <div className="dark relative min-h-screen bg-[#0a0a0a] text-white">
      {/* Grid pattern background */}
      <div className="pointer-events-none fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
      <Navbar />
      <main className="relative z-10 py-16 md:py-24">
        <MaxWidthWrapper>
          {/* Back link */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour a l&apos;accueil
          </Link>

          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">A propos de DSPilot</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              La plateforme de gestion des performances concue par et pour les managers de stations Amazon DSP.
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 font-semibold text-2xl">Notre histoire</h2>
                <p className="text-muted-foreground">
                  DSPilot est ne en 2026 d&apos;un constat simple : les managers de stations Amazon DSP passent trop de
                  temps a collecter et analyser manuellement les donnees de performance de leurs livreurs. Entre les
                  rapports DWC, les scores IADC, le suivi des erreurs et le coaching, ce sont des heures precieuses
                  perdues chaque semaine.
                </p>
              </section>

              <section>
                <h2 className="mb-4 font-semibold text-2xl">Notre mission</h2>
                <p className="text-muted-foreground">
                  Aider les DSP managers a gagner 3 heures par semaine grace a l&apos;intelligence artificielle et
                  l&apos;automatisation. Nous transformons des donnees brutes en insights actionnables, et des processus
                  manuels en workflows automatises.
                </p>
              </section>

              <section>
                <h2 className="mb-4 font-semibold text-2xl">Pourquoi DSPilot ?</h2>
                <p className="text-muted-foreground">
                  Nous comprenons les defis quotidiens des managers DSP car nous venons de ce milieu. DSPilot n&apos;est
                  pas un outil generique adapte au secteur : c&apos;est une solution concue des le depart pour repondre
                  aux besoins specifiques des stations Amazon.
                </p>
              </section>
            </div>

            <div className="space-y-6">
              {/* Values cards */}
              <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <Target className="size-6 text-blue-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Focus performance</h3>
                <p className="text-muted-foreground text-sm">
                  Chaque fonctionnalite est pensee pour ameliorer les indicateurs cles : DWC, IADC, erreurs, et
                  engagement des livreurs.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Zap className="size-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Automatisation intelligente</h3>
                <p className="text-muted-foreground text-sm">
                  L&apos;IA analyse vos donnees et suggere des actions de coaching ciblees pour chaque livreur.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-500/20">
                  <Users className="size-6 text-purple-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Concu pour les equipes</h3>
                <p className="text-muted-foreground text-sm">
                  Multi-utilisateurs, partage de rapports, et communication automatisee avec vos livreurs via WhatsApp.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-orange-500/20">
                  <Building2 className="size-6 text-orange-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Base en France</h3>
                <p className="text-muted-foreground text-sm">
                  Une equipe francaise qui comprend les specificites du marche DSP en France et en Europe.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-16 rounded-xl border border-border/40 bg-card/50 p-8 text-center backdrop-blur-sm">
            <h2 className="mb-4 font-semibold text-2xl">Contactez-nous</h2>
            <p className="mb-6 text-muted-foreground">Une question ? Une suggestion ? Nous sommes a votre ecoute.</p>
            <a
              href="mailto:contact@dspilot.fr"
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
            >
              contact@dspilot.fr
            </a>
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </div>
  );
}
