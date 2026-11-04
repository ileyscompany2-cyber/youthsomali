import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.APP_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
  const fixed = ["", "/about", "/programs", "/projects", "/news", "/events", "/gallery", "/team", "/partners", "/reports", "/contact", "/privacy", "/terms"]
    .map(route => ({ url: `${siteUrl}${route}`, lastModified: new Date(), changeFrequency: route ? "monthly" as const : "weekly" as const, priority: route ? 0.7 : 1 }));
  const [articles, projects] = await Promise.all([
    query<RowDataPacket & { slug: string; updatedAt: Date }>("SELECT slug, updatedAt FROM Article WHERE status = 'PUBLISHED' AND publishedAt <= NOW()"),
    query<RowDataPacket & { slug: string; updatedAt: Date }>("SELECT slug, updatedAt FROM Project WHERE status = 'PUBLISHED'"),
  ]);
  return [
    ...fixed,
    ...articles.map(article => ({ url: `${siteUrl}/news/${article.slug}`, lastModified: article.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...projects.map(project => ({ url: `${siteUrl}/projects/${project.slug}`, lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
