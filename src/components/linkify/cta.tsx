"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LampContainer } from "@/components/ui/lamp";

export function CTA() {
  return (
    <section className="relative">
      <LampContainer>
        <h2 className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-center font-bold text-3xl text-transparent tracking-tight md:text-5xl lg:text-6xl">
          Prêt à transformer
          <br />
          votre station DSP ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Rejoignez les managers qui ont déjà amélioré leurs performances avec DSPilot. Commencez votre essai gratuit
          aujourd&apos;hui.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Link href="/sign-up">
              Commencer maintenant
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </LampContainer>
    </section>
  );
}
