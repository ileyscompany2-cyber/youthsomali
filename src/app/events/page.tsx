import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publishedEvents } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function EventsPage() {
  const items = await publishedEvents();
  return <PublicLayout><PageIntro title="Events" description="Upcoming public events shared by Youth for Peace and Prosperous." /><CollectionSection><PublicCards items={items} emptyMessage="No upcoming events have been announced." /></CollectionSection></PublicLayout>;
}
