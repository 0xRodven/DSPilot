"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LampContainer } from "@/components/ui/lamp";

export function CTA() {
  return (
    <section className="relative">
      <LampContainer>
        <h2 className="mt-8 text-center font-bold text-3xl tracking-tight md:text-5xl">
          <span className="bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-transparent">
            Votre station merite mieux qu&apos;un tableur.
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Passez a DSPilot.
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Commencez gratuitement avec 20 livreurs. Pas de carte bancaire, pas d&apos;engagement, pas de mauvaise
          surprise.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button size="lg" asChild className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Link href="/sign-up">
              Creer mon compte gratuit
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            Operationnel en 2 minutes · Import de vos premieres donnees en 30 secondes
          </p>
        </div>
      </LampContainer>
    </section>
  );
}
