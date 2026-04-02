import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";

export const metadata: Metadata = {
  title: "Mentions legales - DSPilot",
  description: "Mentions legales de DSPilot, plateforme SaaS de gestion des performances pour stations Amazon DSP.",
};

export default function LegalPage() {
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
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">Mentions legales</h1>
            <p className="text-muted-foreground">Informations legales relatives au site www.dspilot.fr</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Editeur du site</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Nom :</strong> DSPilot
                  </p>
                  <p>
                    <strong className="text-foreground">Forme juridique :</strong> Entreprise individuelle
                  </p>
                  <p>
                    <strong className="text-foreground">Adresse :</strong> France
                  </p>
                  <p>
                    <strong className="text-foreground">Email :</strong>{" "}
                    <a href="mailto:contact@dspilot.fr" className="text-blue-400 hover:underline">
                      contact@dspilot.fr
                    </a>
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Directeur de la publication</h2>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Nom :</strong> Ousmane
                </p>
                <p className="mt-2 text-muted-foreground">
                  <strong className="text-foreground">Contact :</strong>{" "}
                  <a href="mailto:contact@dspilot.fr" className="text-blue-400 hover:underline">
                    contact@dspilot.fr
                  </a>
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Hebergement</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-medium text-foreground">Application web</h3>
                    <div className="space-y-1 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Hebergeur :</strong> Vercel Inc.
                      </p>
                      <p>
                        <strong className="text-foreground">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789,
                        Etats-Unis
                      </p>
                      <p>
                        <strong className="text-foreground">Site web :</strong>{" "}
                        <a
                          href="https://vercel.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          vercel.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 font-medium text-foreground">Base de donnees</h3>
                    <div className="space-y-1 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Hebergeur :</strong> Convex Inc.
                      </p>
                      <p>
                        <strong className="text-foreground">Localisation :</strong> Etats-Unis
                      </p>
                      <p>
                        <strong className="text-foreground">Site web :</strong>{" "}
                        <a
                          href="https://convex.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          convex.dev
                        </a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 font-medium text-foreground">Authentification</h3>
                    <div className="space-y-1 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Fournisseur :</strong> Clerk Inc.
                      </p>
                      <p>
                        <strong className="text-foreground">Localisation :</strong> Etats-Unis
                      </p>
                      <p>
                        <strong className="text-foreground">Site web :</strong>{" "}
                        <a
                          href="https://clerk.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          clerk.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Propriete intellectuelle</h2>
                <p className="text-muted-foreground">
                  L&apos;ensemble du contenu du site DSPilot (textes, images, logos, graphismes, interface, code source)
                  est protege par le droit de la propriete intellectuelle. Toute reproduction, representation,
                  modification, publication ou adaptation de tout ou partie du site, quel que soit le moyen ou le
                  procede utilise, est interdite sans autorisation ecrite prealable de DSPilot.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Donnees personnelles</h2>
                <p className="text-muted-foreground">
                  Le traitement des donnees personnelles est decrit dans notre{" "}
                  <Link href="/privacy" className="text-blue-400 hover:underline">
                    Politique de confidentialite
                  </Link>
                  . Conformement a la loi Informatique et Libertes du 6 janvier 1978 modifiee et au Reglement General
                  sur la Protection des Donnees (RGPD), vous disposez de droits sur vos donnees personnelles.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Cookies</h2>
                <p className="text-muted-foreground">
                  Le site DSPilot utilise uniquement des cookies techniques strictement necessaires au fonctionnement du
                  service (authentification). Aucun cookie publicitaire ou de tracking n&apos;est utilise. Pour plus
                  d&apos;informations, consultez notre{" "}
                  <Link href="/privacy" className="text-blue-400 hover:underline">
                    Politique de confidentialite
                  </Link>
                  .
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Liens hypertextes</h2>
                <p className="text-muted-foreground">
                  Le site DSPilot peut contenir des liens vers d&apos;autres sites web. DSPilot n&apos;exerce aucun
                  controle sur ces sites externes et decline toute responsabilite quant a leur contenu ou leurs
                  pratiques en matiere de protection des donnees.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Droit applicable</h2>
                <p className="text-muted-foreground">
                  Les presentes mentions legales sont regies par le droit francais. En cas de litige, les tribunaux
                  francais seront seuls competents.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative au site ou aux presentes mentions legales :{" "}
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
