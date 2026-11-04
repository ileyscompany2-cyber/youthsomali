import { notFound } from "next/navigation";
import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { publishedArticle } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await publishedArticle(slug);
  if (!article) notFound();

  return <PublicLayout><PageIntro title={article.title} description={article.summary} eyebrow={article.category.name} />
    <CollectionSection><article className="detail-content">{article.featuredImageUrl && <img className="detail-image" src={article.featuredImageUrl} alt={article.title} />}<p className="card-meta">{article.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(article.publishedAt) : ""}</p><div className="prose-ypp preserve-lines">{article.body}</div></article></CollectionSection>
  </PublicLayout>;
}
