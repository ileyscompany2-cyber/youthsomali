import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedReports } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports and publications" };

export default async function ReportsPage() {
  const items = await publishedReports();
  return <PublicLayout><PageIntro title="Reports and publications" description="Documents YPP has made publicly available." /><CollectionSection><PublicCards items={items} emptyMessage="No reports or publications have been shared yet." kind="reports" /></CollectionSection></PublicLayout>;
}
