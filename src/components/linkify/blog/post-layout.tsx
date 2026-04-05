"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface PostLayoutProps {
  title: string;
  description: string;
  date: string;
  author: string;
  readingTime: string;
  tags: string[];
  contentHtml: string;
  headings: { id: string; text: string; level: number }[];
  lang: "fr" | "en";
  ctaText: string;
  ctaHref: string;
  backText: string;
  backHref: string;
}

export function PostLayout({
  title,
  date,
  author,
  readingTime,
  tags,
  contentHtml,
  headings,
  lang,
  ctaText,
  ctaHref,
  backText,
  backHref,
}: PostLayoutProps) {
  const [activeId, setActiveId] = useState<string>("");
  const formattedDate = new Date(date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="px-6 pt-24 pb-20" style={{ background: "#FAFAF8" }}>
      <div className="mx-auto max-w-[1200px]">
        {/* Back link */}
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-2 text-sm transition-colors duration-200"
          style={{ color: "#8A8A8A" }}
        >
          <ArrowLeft className="size-4" />
          {backText}
        </Link>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 font-medium text-[12px]"
                style={{ background: "#EFF6FF", color: "#2563EB" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1
            className="mb-4 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#8A8A8A" }}>
            <span className="font-medium" style={{ color: "#4A4A4A" }}>
              {author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {readingTime}
            </span>
          </div>
        </header>

        {/* Content + TOC */}
        <div className="grid gap-12 lg:grid-cols-[1fr_250px]">
          {/* Article */}
          <article
            className="max-w-none [&>h2]:mb-4 [&>h2]:mt-12 [&>h2]:font-[family-name:var(--font-display)] [&>h2]:text-[28px] [&>h2]:leading-[1.3] [&>h2]:tracking-[-0.02em] [&>h2]:text-[#1A1A1A] [&>h3]:mb-3 [&>h3]:mt-8 [&>h3]:font-[family-name:var(--font-display)] [&>h3]:text-[22px] [&>h3]:leading-[1.3] [&>h3]:text-[#1A1A1A] [&>hr]:my-12 [&>hr]:border-[#E8E5DF] [&>ol]:my-6 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:text-[16px] [&>ol]:leading-[1.8] [&>ol]:text-[#4A4A4A] [&>p>a]:text-[#2563EB] [&>p>a]:underline [&>p>strong]:font-semibold [&>p>strong]:text-[#1A1A1A] [&>p]:mb-6 [&>p]:text-[16px] [&>p]:leading-[1.8] [&>p]:text-[#4A4A4A] [&>ul]:my-6 [&>ul]:space-y-2 [&>ul]:pl-6 [&>ul]:text-[16px] [&>ul]:leading-[1.8] [&>ul]:text-[#4A4A4A]"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content rendered from trusted source
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Sticky TOC */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                <p className="mb-3 font-semibold text-[12px] uppercase tracking-wider" style={{ color: "#8A8A8A" }}>
                  {lang === "fr" ? "Sommaire" : "On this page"}
                </p>
                <ul className="space-y-2 border-l" style={{ borderColor: "#E8E5DF" }}>
                  {headings.map((h) => (
                    <li key={h.id} style={{ paddingLeft: h.level === 3 ? "24px" : "12px" }}>
                      <a
                        href={`#${h.id}`}
                        className="block text-[13px] leading-snug transition-colors duration-200"
                        style={{
                          color: activeId === h.id ? "#2563EB" : "#8A8A8A",
                          borderLeft: activeId === h.id ? "2px solid #2563EB" : "none",
                          marginLeft: activeId === h.id ? "-1px" : "0",
                          paddingLeft: activeId === h.id ? "11px" : "0",
                        }}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>

        {/* CTA */}
        <div
          className="mt-16 rounded-xl border p-8 text-center"
          style={{ background: "#FFFFFF", borderColor: "#E8E5DF" }}
        >
          <p className="mb-4 font-[family-name:var(--font-display)] text-2xl" style={{ color: "#1A1A1A" }}>
            {lang === "fr" ? "Prêt à automatiser votre suivi DSP ?" : "Ready to automate your DSP tracking?"}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-white transition-all duration-200"
            style={{ background: "#2563EB" }}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
