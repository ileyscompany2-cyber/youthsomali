import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedPartners } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partners" };

export default async function PartnersPage() {
  const items = await publishedPartners();
  return <PublicLayout><PageIntro title="Partners and collaborators" description="Organizations listed here have been confirmed and approved by YPP." /><CollectionSection><PublicCards items={items.map(partner => ({ ...partner, title: partner.name }))} emptyMessage="Partner information will be published after confirmation." kind="partners" /></CollectionSection></PublicLayout>;
}
