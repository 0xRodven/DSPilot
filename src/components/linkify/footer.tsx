"use client";

import Image from "next/image";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

const footerLinks = {
  product: [
    { name: "Fonctionnalites", href: "#features" },
    { name: "Comment ca marche", href: "#process" },
    { name: "Tarifs", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ],
  company: [
    { name: "À propos", href: "/about" },
    { name: "Contact", href: "mailto:contact@dspilot.fr" },
  ],
  legal: [
    { name: "Mentions légales", href: "/legal" },
    { name: "CGU", href: "/terms" },
    { name: "Confidentialité", href: "/privacy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-border/40 border-t bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/">
              <Image src="/logo/DSPilot_Full.png" alt="DSPilot" width={180} height={68} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-muted-foreground text-sm">
              La plateforme de gestion des performances pour stations DSP Amazon.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground text-sm">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground text-sm">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground text-sm">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-border/40 border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-sm">© 2026 DSPilot. Tous droits reserves.</p>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
