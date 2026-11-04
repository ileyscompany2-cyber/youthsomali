import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { GalleryExplorer } from "@/components/GalleryExplorer";
import { publishedGallery } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const items = await publishedGallery();
  return <PublicLayout><PageIntro title="Photo gallery" description="Images selected and approved by YPP for public display." /><CollectionSection><GalleryExplorer items={items} /></CollectionSection></PublicLayout>;
}
