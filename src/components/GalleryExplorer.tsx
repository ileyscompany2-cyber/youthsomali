"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryItem = { id: string; title: string; altText: string; imageUrl: string; category: string; caption: string | null };

export function GalleryExplorer({ items }: { items: GalleryItem[] }) {
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);
  const categories = ["All", ...new Set(items.map(item => item.category))];
  const filtered = useMemo(() => category === "All" ? items : items.filter(item => item.category === category), [items, category]);

  useEffect(() => {
    if (selected === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight") setSelected(index => index === null ? null : (index + 1) % filtered.length);
      if (event.key === "ArrowLeft") setSelected(index => index === null ? null : (index - 1 + filtered.length) % filtered.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, filtered.length]);

  if (!items.length) return <p className="empty-state">No gallery images have been published yet.</p>;
  const active = selected === null ? null : filtered[selected];

  return <>
    <div className="gallery-controls" aria-label="Filter images by category">{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); setSelected(null); }}>{item}</button>)}</div>
    <div className="gallery-items">{filtered.map((item, index) => <button className="gallery-item" key={item.id} type="button" onClick={() => setSelected(index)} aria-label={`View image: ${item.altText}`}><img src={item.imageUrl} alt={item.altText} loading="lazy" /><span>{item.title}</span></button>)}</div>
    {active && <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.title} onClick={() => setSelected(null)}>
      <div className="lightbox-content" onClick={event => event.stopPropagation()}>
        <button className="lightbox-nav" type="button" onClick={() => setSelected(index => index === null ? null : (index - 1 + filtered.length) % filtered.length)} aria-label="Previous image">‹</button>
        <img src={active.imageUrl} alt={active.altText} />
        <button className="lightbox-nav" type="button" onClick={() => setSelected(index => index === null ? null : (index + 1) % filtered.length)} aria-label="Next image">›</button>
        <button className="lightbox-close" type="button" onClick={() => setSelected(null)}>Close</button>
        <p className="lightbox-caption">{active.caption || active.title}</p>
      </div>
    </div>}
  </>;
}
