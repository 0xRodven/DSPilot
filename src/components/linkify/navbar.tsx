"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Fonctionnalités", href: "#features" },
  { name: "Comment ça marche", href: "#process" },
  { name: "Tarifs", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 h-16 border-b"
      style={{
        background: "rgba(250,250,248,0.85)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderColor: "#E8E5DF",
      }}
    >
      <nav className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image src="/logo/DSPilot_Full.png" alt="DSPilot" width={180} height={68} className="h-10 w-auto" priority />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="font-medium text-sm transition-colors duration-200"
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
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/sign-in"
            className="font-medium text-sm transition-colors duration-200"
            style={{ color: "#4A4A4A" }}
          >
            Connexion
          </Link>
          <Link
            href="/sign-up"
            className="hover:-translate-y-px rounded-lg px-6 py-2.5 font-semibold text-sm text-white transition-all duration-200"
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

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          style={{ color: "#4A4A4A" }}
        >
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <div className={cn("md:hidden", isOpen ? "block" : "hidden")}>
        <div
          className="space-y-1 border-t px-6 py-4"
          style={{ background: "rgba(250,250,248,0.95)", borderColor: "#E8E5DF" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => {
                setIsOpen(false);
              }}
              className="block rounded-md px-3 py-2 text-base transition-colors"
              style={{ color: "#4A4A4A" }}
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 pt-4">
            <Link
              href="/sign-in"
              className="block w-full rounded-md px-3 py-2 text-center text-base"
              style={{ color: "#4A4A4A" }}
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="block w-full rounded-lg py-2.5 text-center font-semibold text-sm text-white"
              style={{ background: "#2563EB" }}
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
