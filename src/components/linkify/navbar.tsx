"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#process", label: "Comment ça marche" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 right-0 left-0 z-50"
      style={{
        background: "rgba(250,250,248,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E5DF",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/DSPilot_Full.png" alt="DSPilot" width={120} height={32} className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
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
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/sign-in"
              className="text-sm transition-colors"
              style={{ color: "#4A4A4A" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#1A1A1A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4A4A4A";
              }}
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg px-4 py-2 font-medium text-sm text-white transition-all"
              style={{ background: "#2563EB" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2563EB";
              }}
            >
              Essai gratuit
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" style={{ color: "#1A1A1A" }} />
            ) : (
              <Menu className="h-6 w-6" style={{ color: "#1A1A1A" }} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden" style={{ borderColor: "#E8E5DF" }}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm"
                  style={{ color: "#4A4A4A" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t" style={{ borderColor: "#E8E5DF" }} />
              <Link href="/sign-in" className="text-sm" style={{ color: "#4A4A4A" }}>
                Connexion
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg px-4 py-2 text-center font-medium text-sm text-white"
                style={{ background: "#2563EB" }}
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
