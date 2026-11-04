"use client";

import { useState } from "react";
import { PublicCards } from "@/components/PublicContent";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featuredImageUrl: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string };
};

export function NewsExplorer({ items }: { items: Article[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = [...new Set(items.map(item => item.category.name))].sort();
  const term = query.trim().toLocaleLowerCase();
  const filtered = items.filter(item =>
    (!category || item.category.name === category) &&
    (!term || `${item.title} ${item.summary} ${item.category.name}`.toLocaleLowerCase().includes(term)),
  );

  return <>
    <div className="news-controls">
      <label>Search news <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Search articles" /></label>
      <label>Category <select value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <p className="card-meta" aria-live="polite">{filtered.length} {filtered.length === 1 ? "article" : "articles"}</p>
    <PublicCards items={filtered.map(item => ({ ...item, imageUrl: item.featuredImageUrl }))} emptyMessage="No published articles match your search." kind="news" />
  </>;
}
