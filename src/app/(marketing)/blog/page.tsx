import type { Metadata } from "next";

import { PostCard } from "@/components/linkify/blog/post-card";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";
import { getBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — DSPilot | Conseils DSP Amazon, coaching livreurs, scorecard",
  description:
    "Guides pratiques pour DSP managers Amazon : scorecard DWC, coaching livreurs, optimisation des performances. Par un DSP manager qui gère 113 livreurs.",
  openGraph: {
    title: "Blog — DSPilot",
    description: "Guides pratiques pour DSP managers Amazon.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function BlogPage() {
  const posts = getBlogPosts("fr");

  return (
    <div className="min-h-screen font-[family-name:var(--font-body)]" style={{ background: "#FAFAF8" }}>
      <Navbar />
      <main className="px-6 pt-24 pb-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12">
            <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
              Blog
            </p>
            <h1
              className="mb-4 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
              style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
            >
              Guides pour DSP managers
            </h1>
            <p className="max-w-2xl text-lg" style={{ color: "#4A4A4A" }}>
              Scorecard, coaching, performance — tout ce qu'on aurait aimé savoir le premier jour. Par un DSP manager
              qui gère 113 livreurs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} lang="fr" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
