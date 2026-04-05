import type { Metadata } from "next";

import { PostLayout } from "@/components/linkify/blog/post-layout";
import { Footer } from "@/components/linkify/en/footer";
import { Navbar } from "@/components/linkify/en/navbar";
import { getBlogPost, getBlogSlugs } from "@/lib/blog";

export async function generateStaticParams() {
  return getBlogSlugs("en").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost("en", slug);
  if (!post) return { title: "Post not found" };

  return {
    title: `${post.title} — DSPilot Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "en_GB",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPageEN({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost("en", slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "DSPilot", url: "https://dspilot.fr" },
    mainEntityOfPage: `https://dspilot.fr/en/blog/${slug}`,
  };

  return (
    <div className="min-h-screen font-[family-name:var(--font-body)]" style={{ background: "#FAFAF8" }}>
      <Navbar />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <PostLayout
          {...post}
          lang="en"
          ctaText="Discover DSPilot"
          ctaHref="/en"
          backText="Back to blog"
          backHref="/en/blog"
        />
      </main>
      <Footer />
    </div>
  );
}
