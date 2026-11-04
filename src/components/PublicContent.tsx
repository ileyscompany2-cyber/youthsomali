import Link from "next/link";
import Image from "next/image";

type PublicCardData = {
  id: string;
  title: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | { name: string };
  location?: string;
  startsAt?: Date | string | null;
  publishedAt?: Date | string | null;
  documentUrl?: string;
  altText?: string;
  caption?: string | null;
  name?: string;
  position?: string;
  biography?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  objectives?: unknown;
};

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date);
}

export function PublicCards({
  items,
  emptyMessage,
  kind = "default",
}: {
  items: PublicCardData[];
  emptyMessage: string;
  kind?: "default" | "programs" | "news" | "gallery" | "team" | "partners" | "reports";
}) {
  if (items.length === 0) {
    return <p className="empty-state" role="status">{emptyMessage}</p>;
  }

  return (
    <div className={`card-grid public-grid public-grid-${kind}`}>
      {items.map((item) => {
        const category = typeof item.category === "string" ? item.category : item.category?.name;
        const date = dateLabel(item.publishedAt ?? item.startsAt);
        const href = kind === "reports" ? item.documentUrl : item.slug ? kind === "news" ? `/news/${item.slug}` : kind === "programs" ? `/programs/${item.slug}` : `/projects/${item.slug}` : undefined;
        const image = item.imageUrl ?? item.logoUrl;

        return (
          <article className={`content-card public-card${kind === "gallery" ? " gallery-card" : ""}`} key={item.id}>
            {image && (
              kind === "partners" && item.websiteUrl ? (
                <a href={item.websiteUrl} target="_blank" rel="noreferrer" aria-label={`Visit ${item.title}`}>
                  <ContentImage src={image} alt={`${item.title} logo`} />
                </a>
              ) : (
                <ContentImage src={image} alt={kind === "programs" ? `Illustrative photograph for ${item.title}` : item.altText || item.title} />
              )
            )}
            {kind === "team" && <div className="public-card-body"><p className="eyebrow">{item.position}</p><h3>{item.name}</h3><p>{item.biography}</p></div>}
            {kind === "gallery" && <div className="public-card-body"><p className="eyebrow">{category}</p><h3>{item.title}</h3>{item.caption && <p>{item.caption}</p>}</div>}
            {kind === "partners" && <div className="public-card-body"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>}
            {kind === "reports" && <div className="public-card-body"><p className="eyebrow">{category}</p><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{date && <p className="card-meta">{date}</p>}<a className="text-link" href={item.documentUrl} target="_blank" rel="noreferrer">Read report ↗</a></div>}
            {(kind === "default" || kind === "news" || kind === "programs") && (
              <div className="public-card-body">
                {category && <p className="eyebrow">{category}</p>}
                <h3>{item.title}</h3>
                {date && <p className="card-meta">{date}</p>}
                {item.location && <p className="card-meta">{item.location}</p>}
                {(item.summary || item.description) && <p>{item.summary || item.description}</p>}
                {href && <Link className="text-link" href={href}>Read more <span aria-hidden="true">→</span></Link>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ContentImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("/") && !src.startsWith("//")) {
    return <Image src={src} alt={alt} width={960} height={640} sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" loading="lazy" />;
  }
  return <img src={src} alt={alt} loading="lazy" />;
}
