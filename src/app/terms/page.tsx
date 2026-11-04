import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";

export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return <PublicLayout><PageIntro title="Terms and conditions" description="Terms for using the Youth for Peace and Prosperous website." /><CollectionSection><article className="detail-content"><h2>Website information</h2><p>Information on this site is provided for general information about YPP. Program, project, event, and publication information is managed by YPP and may be updated or removed.</p><h2>Respectful use</h2><p>You may not misuse this website, attempt to access restricted areas without authorization, or submit unlawful or harmful content through its forms.</p><h2>Contact</h2><p>For questions about these terms, contact <a href="mailto:youthforpeace15@gmail.com">youthforpeace15@gmail.com</a>.</p></article></CollectionSection></PublicLayout>;
}
