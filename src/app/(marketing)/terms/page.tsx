import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";

export const metadata: Metadata = {
  title: "Conditions generales d'utilisation - DSPilot",
  description:
    "Conditions generales d'utilisation de la plateforme DSPilot, SaaS de gestion des performances pour stations Amazon DSP.",
};

export default function TermsPage() {
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
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
              Conditions generales d&apos;utilisation
            </h1>
            <p className="text-muted-foreground">Derniere mise a jour : Avril 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 1 - Objet</h2>
                <p className="text-muted-foreground">
                  Les presentes Conditions Generales d&apos;Utilisation (CGU) ont pour objet de definir les modalites et
                  conditions d&apos;utilisation de la plateforme DSPilot, accessible a l&apos;adresse www.dspilot.fr.
                  DSPilot est une solution SaaS (Software as a Service) de gestion des performances destinees aux
                  managers de stations Amazon DSP.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 2 - Acceptation des CGU</h2>
                <p className="text-muted-foreground">
                  L&apos;inscription et l&apos;utilisation de DSPilot impliquent l&apos;acceptation pleine et entiere
                  des presentes CGU. L&apos;utilisateur reconnait avoir pris connaissance des presentes CGU et les
                  accepter sans reserve. DSPilot se reserve le droit de modifier les CGU a tout moment. Les utilisateurs
                  seront informes des modifications par email.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 3 - Inscription et compte</h2>
                <p className="mb-4 text-muted-foreground">
                  Pour utiliser DSPilot, l&apos;utilisateur doit creer un compte en fournissant des informations exactes
                  et a jour. L&apos;utilisateur est responsable de la confidentialite de ses identifiants de connexion.
                </p>
                <p className="text-muted-foreground">L&apos;utilisateur s&apos;engage a :</p>
                <ul className="mt-2 ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Fournir des informations veridiques lors de l&apos;inscription</li>
                  <li>Maintenir la confidentialite de son mot de passe</li>
                  <li>Notifier immediatement DSPilot en cas d&apos;utilisation non autorisee</li>
                  <li>Ne pas partager son compte avec des tiers non autorises</li>
                </ul>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 4 - Abonnements et tarifs</h2>
                <p className="mb-4 text-muted-foreground">DSPilot propose plusieurs formules d&apos;abonnement :</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Free</strong> : acces limite aux fonctionnalites de base,
                    gratuit
                  </li>
                  <li>
                    <strong className="text-foreground">Pro</strong> : acces complet aux fonctionnalites, facturation
                    mensuelle ou annuelle
                  </li>
                  <li>
                    <strong className="text-foreground">Enterprise</strong> : fonctionnalites avancees, support dedie,
                    tarification sur mesure
                  </li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  Les tarifs sont indiques en euros TTC. DSPilot se reserve le droit de modifier ses tarifs, avec un
                  preavis de 30 jours pour les abonnes existants.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 5 - Utilisation du service</h2>
                <p className="mb-4 text-muted-foreground">
                  L&apos;utilisateur s&apos;engage a utiliser DSPilot conformement a sa destination et aux lois en
                  vigueur. Il est interdit de :
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Utiliser le service a des fins illegales ou non autorisees</li>
                  <li>Tenter de compromettre la securite ou l&apos;integrite du service</li>
                  <li>Reproduire, copier ou revendre tout ou partie du service</li>
                  <li>Importer des donnees sans avoir les droits necessaires</li>
                  <li>Surcharger intentionnellement l&apos;infrastructure technique</li>
                </ul>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 6 - Propriete intellectuelle</h2>
                <p className="text-muted-foreground">
                  DSPilot et l&apos;ensemble de ses composants (interface, code, algorithmes, documentation, marques,
                  logos) sont la propriete exclusive de DSPilot. Toute reproduction, representation, modification ou
                  exploitation non autorisee est strictement interdite. L&apos;utilisateur conserve la propriete des
                  donnees qu&apos;il importe dans la plateforme.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 7 - Responsabilite</h2>
                <p className="mb-4 text-muted-foreground">
                  DSPilot s&apos;engage a fournir un service de qualite mais ne peut garantir un fonctionnement
                  ininterrompu ou exempt d&apos;erreurs.
                </p>
                <p className="mb-4 text-muted-foreground">DSPilot ne saurait etre tenu responsable :</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Des decisions prises par l&apos;utilisateur sur la base des analyses fournies</li>
                  <li>Des dommages indirects, y compris la perte de donnees ou de revenus</li>
                  <li>Des interruptions de service dues a des maintenances ou cas de force majeure</li>
                  <li>De l&apos;exactitude des donnees importees par l&apos;utilisateur</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  La responsabilite de DSPilot est limitee au montant des sommes effectivement versees par
                  l&apos;utilisateur au cours des 12 derniers mois.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 8 - Donnees personnelles</h2>
                <p className="text-muted-foreground">
                  Le traitement des donnees personnelles est regi par notre{" "}
                  <Link href="/privacy" className="text-blue-400 hover:underline">
                    Politique de confidentialite
                  </Link>
                  , qui fait partie integrante des presentes CGU.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 9 - Resiliation</h2>
                <p className="mb-4 text-muted-foreground">
                  L&apos;utilisateur peut resilier son abonnement a tout moment depuis son espace client. La resiliation
                  prend effet a la fin de la periode d&apos;abonnement en cours.
                </p>
                <p className="text-muted-foreground">
                  DSPilot se reserve le droit de suspendre ou resilier un compte en cas de violation des presentes CGU,
                  sans preavis ni indemnite.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 10 - Droit applicable et litiges</h2>
                <p className="mb-4 text-muted-foreground">
                  Les presentes CGU sont regies par le droit francais. En cas de litige relatif a l&apos;interpretation
                  ou l&apos;execution des presentes, les parties s&apos;efforceront de trouver une solution amiable.
                </p>
                <p className="text-muted-foreground">
                  A defaut d&apos;accord amiable, tout litige sera soumis aux tribunaux competents de Paris, France.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Article 11 - Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question concernant les presentes CGU, vous pouvez nous contacter a :{" "}
                  <a href="mailto:contact@dspilot.fr" className="text-blue-400 hover:underline">
                    contact@dspilot.fr
                  </a>
                </p>
              </section>
            </div>
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </div>
  );
}
