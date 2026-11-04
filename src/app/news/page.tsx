import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { NewsExplorer } from "@/components/NewsExplorer";
import { publishedArticles } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "News and updates" };

export default async function NewsPage() {
  const items = await publishedArticles();
  return <PublicLayout><PageIntro title="News and updates" description="News and announcements approved by YPP for public sharing." /><CollectionSection><NewsExplorer items={items} /></CollectionSection></PublicLayout>;
}
