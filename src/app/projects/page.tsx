import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedProjects } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const items = await publishedProjects();
  return <PublicLayout><PageIntro title="Projects and activities" description="Explore projects and activities that YPP has reviewed and approved for public sharing." /><CollectionSection><PublicCards items={items} emptyMessage="No projects have been published yet." /></CollectionSection></PublicLayout>;
}
