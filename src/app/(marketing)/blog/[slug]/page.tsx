import type { Metadata } from "next";

import { PostLayout } from "@/components/linkify/blog/post-layout";
import { Footer } from "@/components/linkify/footer";
import { Navbar } from "@/components/linkify/navbar";
import { getBlogPost, getBlogSlugs } from "@/lib/blog";

export async function generateStaticParams() {
  return getBlogSlugs("fr").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost("fr", slug);
  if (!post) return { title: "Article non trouvé" };

  return {
    title: `${post.title} — DSPilot Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "fr_FR",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost("fr", slug);

  if (!post) {
    return <div>Article non trouvé</div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "DSPilot", url: "https://dspilot.fr" },
    mainEntityOfPage: `https://dspilot.fr/blog/${slug}`,
  };

  return (
    <div className="min-h-screen font-[family-name:var(--font-body)]" style={{ background: "#FAFAF8" }}>
      <Navbar />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <PostLayout
          {...post}
          lang="fr"
          ctaText="Découvrir DSPilot"
          ctaHref="/"
          backText="Retour au blog"
          backHref="/blog"
        />
      </main>
      <Footer />
    </div>
  );
}
