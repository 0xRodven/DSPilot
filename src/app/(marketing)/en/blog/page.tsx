import type { Metadata } from "next";

import { PostCard } from "@/components/linkify/blog/post-card";
import { Footer } from "@/components/linkify/en/footer";
import { Navbar } from "@/components/linkify/en/navbar";
import { getBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — DSPilot | Amazon DSP Owner Guides, Driver Coaching, Scorecard Tips",
  description:
    "Practical guides for Amazon DSP owners: DWC scorecard, driver coaching, performance optimisation. By a DSP owner managing 113 drivers.",
  openGraph: {
    title: "Blog — DSPilot",
    description: "Practical guides for Amazon DSP owners.",
    type: "website",
    locale: "en_GB",
  },
};

export default function BlogPageEN() {
  const posts = getBlogPosts("en");

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
              Guides for DSP owners
            </h1>
            <p className="max-w-2xl text-lg" style={{ color: "#4A4A4A" }}>
              Scorecard, coaching, performance — everything we wish we'd known on day one. By a DSP owner managing 113
              drivers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} lang="en" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
