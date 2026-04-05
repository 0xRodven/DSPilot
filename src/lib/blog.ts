import matter from "gray-matter";
import readingTime from "reading-time";
import { remark } from "remark";
import html from "remark-html";

import fs from "node:fs";
import path from "node:path";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  readingTime: string;
  content: string;
}

export interface BlogPostWithHtml extends BlogPost {
  contentHtml: string;
  headings: { id: string; text: string; level: number }[];
}

const contentDir = path.join(process.cwd(), "content/blog");

export function getBlogPosts(lang: "fr" | "en"): BlogPost[] {
  const dir = path.join(contentDir, lang);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(dir, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    const stats = readingTime(content);

    return {
      slug,
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      author: (data.author as string) || "Ousmane",
      tags: (data.tags as string[]) || [],
      image: (data.image as string) || "",
      readingTime: stats.text.replace("min read", "min"),
      content,
    };
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export async function getBlogPost(lang: "fr" | "en", slug: string): Promise<BlogPostWithHtml | null> {
  const filePath = path.join(contentDir, lang, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);
  const headings = extractHeadings(content);

  const processed = await remark().use(html, { sanitize: false }).process(content);
  let contentHtml = processed.toString();

  // Add IDs to headings in HTML for TOC anchor links
  for (const heading of headings) {
    const tag = `h${heading.level}`;
    const escapedText = heading.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    contentHtml = contentHtml.replace(
      new RegExp(`<${tag}>(${escapedText})</${tag}>`),
      `<${tag} id="${heading.id}">$1</${tag}>`,
    );
  }

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    author: (data.author as string) || "Ousmane",
    tags: (data.tags as string[]) || [],
    image: (data.image as string) || "",
    readingTime: stats.text.replace("min read", "min"),
    content,
    contentHtml,
    headings,
  };
}

export function getBlogSlugs(lang: "fr" | "en"): string[] {
  const dir = path.join(contentDir, lang);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
