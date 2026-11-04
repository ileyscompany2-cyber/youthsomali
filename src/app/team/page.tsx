import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedTeam } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our team" };

export default async function TeamPage() {
  const items = await publishedTeam();
  return <PublicLayout><PageIntro title="Our team" description="Meet the team members whose profiles have been approved for publication." /><CollectionSection><PublicCards items={items.map(person => ({ ...person, title: person.name }))} emptyMessage="Team profiles are being prepared for publication." kind="team" /></CollectionSection></PublicLayout>;
}
