import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";

export const metadata: Metadata = {
  title: "Politique de confidentialite - DSPilot",
  description: "Politique de confidentialite et protection des donnees personnelles de DSPilot, conforme au RGPD.",
};

export default function PrivacyPage() {
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
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">Politique de confidentialite</h1>
            <p className="text-muted-foreground">Derniere mise a jour : Avril 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">1. Responsable du traitement</h2>
                <p className="text-muted-foreground">
                  DSPilot, dont le siege social est situe en France, est responsable du traitement des donnees
                  personnelles collectees via la plateforme DSPilot. Pour toute question relative a la protection de vos
                  donnees, vous pouvez nous contacter a :{" "}
                  <a href="mailto:privacy@dspilot.fr" className="text-blue-400 hover:underline">
                    privacy@dspilot.fr
                  </a>
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">2. Donnees collectees</h2>
                <p className="mb-4 text-muted-foreground">Nous collectons les categories de donnees suivantes :</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Donnees d&apos;identification</strong> : nom, prenom, adresse
                    email, nom de la station Amazon
                  </li>
                  <li>
                    <strong className="text-foreground">Donnees de connexion</strong> : adresse IP, type de navigateur,
                    pages visitees, horodatage des connexions
                  </li>
                  <li>
                    <strong className="text-foreground">Donnees metier importees</strong> : rapports DWC/IADC Amazon,
                    noms des livreurs, scores de performance, types d&apos;erreurs, historique de coaching
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">3. Finalites du traitement</h2>
                <p className="mb-4 text-muted-foreground">Vos donnees sont traitees pour les finalites suivantes :</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Fourniture et amelioration de la plateforme DSPilot</li>
                  <li>Analyse des performances de livraison et generation de rapports</li>
                  <li>Suggestions de coaching personnalisees basees sur l&apos;IA</li>
                  <li>Envoi de notifications et recaps hebdomadaires</li>
                  <li>Support client et assistance technique</li>
                </ul>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">4. Base legale</h2>
                <p className="text-muted-foreground">
                  Le traitement de vos donnees repose sur l&apos;execution du contrat d&apos;abonnement a DSPilot
                  (article 6.1.b du RGPD) et, le cas echeant, sur votre consentement pour certaines fonctionnalites
                  optionnelles (article 6.1.a du RGPD).
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">5. Duree de conservation</h2>
                <p className="text-muted-foreground">
                  Vos donnees sont conservees pendant toute la duree de votre abonnement actif, puis pendant une periode
                  de 3 ans a compter de la cloture de votre compte, conformement aux obligations legales de
                  conservation. Les donnees de performance importees peuvent etre supprimees a votre demande a tout
                  moment.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">6. Vos droits</h2>
                <p className="mb-4 text-muted-foreground">Conformement au RGPD, vous disposez des droits suivants :</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Droit d&apos;acces</strong> : obtenir une copie de vos donnees
                    personnelles
                  </li>
                  <li>
                    <strong className="text-foreground">Droit de rectification</strong> : corriger des donnees inexactes
                    ou incompletes
                  </li>
                  <li>
                    <strong className="text-foreground">Droit a l&apos;effacement</strong> : demander la suppression de
                    vos donnees
                  </li>
                  <li>
                    <strong className="text-foreground">Droit a la portabilite</strong> : recevoir vos donnees dans un
                    format structure
                  </li>
                  <li>
                    <strong className="text-foreground">Droit d&apos;opposition</strong> : vous opposer a certains
                    traitements
                  </li>
                  <li>
                    <strong className="text-foreground">Droit a la limitation</strong> : demander la suspension du
                    traitement
                  </li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  Pour exercer ces droits, contactez :{" "}
                  <a href="mailto:privacy@dspilot.fr" className="text-blue-400 hover:underline">
                    privacy@dspilot.fr
                  </a>
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">7. Hebergement et transferts</h2>
                <p className="text-muted-foreground">DSPilot utilise les services d&apos;hebergement suivants :</p>
                <ul className="mt-4 ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Vercel Inc.</strong> (Etats-Unis) pour l&apos;hebergement de
                    l&apos;application web
                  </li>
                  <li>
                    <strong className="text-foreground">Convex Inc.</strong> (Etats-Unis) pour la base de donnees temps
                    reel
                  </li>
                  <li>
                    <strong className="text-foreground">Clerk Inc.</strong> (Etats-Unis) pour l&apos;authentification
                  </li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  Ces transferts vers les Etats-Unis sont encadres par des clauses contractuelles types approuvees par
                  la Commission europeenne.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">8. Cookies</h2>
                <p className="text-muted-foreground">
                  DSPilot utilise uniquement des cookies strictement necessaires au fonctionnement du service
                  (authentification via Clerk). Nous n&apos;utilisons pas de cookies de tracking, de publicite ou
                  d&apos;analyse comportementale.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">9. Securite</h2>
                <p className="text-muted-foreground">
                  Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos
                  donnees : chiffrement SSL/TLS, authentification securisee, controle d&apos;acces strict, et audits de
                  securite reguliers.
                </p>
              </section>

              <section className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-xl">10. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question concernant cette politique ou pour exercer vos droits, contactez notre Delegue a
                  la Protection des Donnees (DPO) :{" "}
                  <a href="mailto:privacy@dspilot.fr" className="text-blue-400 hover:underline">
                    privacy@dspilot.fr
                  </a>
                </p>
                <p className="mt-4 text-muted-foreground">
                  Vous avez egalement le droit d&apos;introduire une reclamation aupres de la CNIL (Commission Nationale
                  de l&apos;Informatique et des Libertes) si vous estimez que le traitement de vos donnees n&apos;est
                  pas conforme a la reglementation.
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
