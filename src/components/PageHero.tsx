import Link from "next/link";

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="page-hero"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-hero-description">{description}</p><div className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{title}</span></div></div></section>;
}
