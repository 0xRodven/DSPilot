"use client";

import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  produit: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  entreprise: [
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Mentions légales", href: "/legal/mentions" },
    { label: "CGU", href: "/legal/cgu" },
    { label: "Politique de confidentialité", href: "/legal/privacy" },
  ],
};

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #E8E5DF" }}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <Image src="/logo/DSPilot_Full.png" alt="DSPilot" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="mb-4 max-w-xs text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
              Le premier outil de gestion DSP Amazon en France. Pilotez votre station, pas vos tableurs.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Produit
            </h4>
            <ul className="space-y-3">
              {footerLinks.produit.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Entreprise
            </h4>
            <ul className="space-y-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
              Légal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: "#4A4A4A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1A1A1A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4A4A4A";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid #E8E5DF" }}>
          <p className="text-center text-sm" style={{ color: "#8A8A8A" }}>
            © 2026 DSPilot. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
