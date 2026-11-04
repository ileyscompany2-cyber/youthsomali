import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { ContactForm } from "@/components/ContactForm";
import { publicOrganizationSettings } from "@/lib/public-data";

export const metadata = { title: "Contact YPP" };

export default async function ContactPage() {
  const settings = await publicOrganizationSettings();
  return <PublicLayout><PageIntro title="Contact us" description="Contact Youth for Peace and Prosperous to learn about our work or discuss a partnership." />
    <CollectionSection><div className="contact-layout"><div><h2>Reach our team</h2><p>{settings.location}</p><p><a href={`mailto:${settings.email}`}>{settings.email}</a></p><p><a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a></p><p>Executive Director: Ibrahim Aden Ali</p></div><ContactForm /></div></CollectionSection>
  </PublicLayout>;
}
