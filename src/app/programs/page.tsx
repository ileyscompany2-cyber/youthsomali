import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedPrograms } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const items = await publishedPrograms();
  return <PublicLayout><PageIntro title="Our programs" description="YPP's core program areas bring people together through dialogue, learning, leadership, and community participation." /><CollectionSection><PublicCards items={items} kind="programs" emptyMessage="Program information will be published here once it has been reviewed." /></CollectionSection></PublicLayout>;
}
