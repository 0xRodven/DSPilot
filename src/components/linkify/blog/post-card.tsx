import Link from "next/link";

import { Calendar, Clock } from "lucide-react";

import type { BlogPost } from "@/lib/blog";

export function PostCard({ post, lang }: { post: BlogPost; lang: "fr" | "en" }) {
  const href = lang === "fr" ? `/blog/${post.slug}` : `/en/blog/${post.slug}`;
  const formattedDate = new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={href} className="group block">
      <article
        className="h-full rounded-xl border p-6 transition-all duration-300 hover:border-[#2563EB] hover:shadow-lg"
        style={{ background: "#FFFFFF", borderColor: "#E8E5DF" }}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 font-medium text-[12px]"
              style={{ background: "#EFF6FF", color: "#2563EB" }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h2
          className="mb-3 font-[family-name:var(--font-display)] text-xl leading-[1.3] transition-colors duration-200 group-hover:text-[#2563EB]"
          style={{ color: "#1A1A1A" }}
        >
          {post.title}
        </h2>

        <p className="mb-4 line-clamp-2 text-[15px] leading-[1.7]" style={{ color: "#4A4A4A" }}>
          {post.description}
        </p>

        <div className="flex items-center gap-4 text-[13px]" style={{ color: "#8A8A8A" }}>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {post.readingTime}
          </span>
        </div>
      </article>
    </Link>
  );
}
