import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <PublicLayout><PageIntro title="Privacy policy" description="How YPP handles information submitted through this website." /><CollectionSection><article className="detail-content"><h2>Information submitted through the contact form</h2><p>When you send a message through this website, the information you provide is stored so YPP can respond. Access to messages is restricted to authorized administrators. Do not send sensitive personal information through the form.</p><h2>Testimonials, images, and public content</h2><p>Testimonials and identifiable images are published only after the appropriate consent and approval have been recorded. Published website content may be visible to anyone on the internet.</p><h2>Retention and questions</h2><p>Contact YPP at <a href="mailto:youthforpeace15@gmail.com">youthforpeace15@gmail.com</a> with privacy questions or requests concerning information submitted to this site.</p></article></CollectionSection></PublicLayout>;
}
