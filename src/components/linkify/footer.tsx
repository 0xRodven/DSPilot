"use client";

import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  product: [
    { name: "Fonctionnalités", href: "#features" },
    { name: "Comment ça marche", href: "#process" },
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
    <footer className="border-t px-6" style={{ borderColor: "#E8E5DF" }}>
      <div className="mx-auto max-w-[1200px] py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/">
              <Image src="/logo/DSPilot_Full.png" alt="DSPilot" width={180} height={68} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "#8A8A8A" }}>
              La plateforme de gestion des performances pour stations DSP Amazon.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[13px] uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Produit
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[13px] uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Entreprise
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[13px] uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Légal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-[13px]" style={{ borderColor: "#E8E5DF", color: "#B8B8B8" }}>
          &copy; 2026 DSPilot. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
