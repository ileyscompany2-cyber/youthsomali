import { PublicLayout, PageIntro } from "@/components/PublicLayout";
import { publicOrganizationSettings } from "@/lib/public-data";

export const metadata = { title: "About YPP" };

export default async function AboutPage() {
  const settings = await publicOrganizationSettings();
  return <PublicLayout><PageIntro title="About YPP" description="Youth for Peace and Prosperous is a youth-led organization supporting peaceful, inclusive, and community-driven development." />
    <section className="section"><div className="container split">
      <div><p className="eyebrow">Our story</p><h2>Rooted in community, led by youth</h2><p>Established on 5 February 2017, Youth for Peace and Prosperous (YPP) works in Southwest State of Somalia and Mogadishu. We bring young people and communities into peacebuilding, leadership, and sustainable development initiatives.</p><p>YPP&apos;s work focuses on youth, women, vulnerable communities, persons with disabilities, and internally displaced persons. Our approach values participation, inclusion, dialogue, and locally grounded solutions.</p><p><strong>Executive Director:</strong> Ibrahim Aden Ali</p></div>
      <div className="split-image" role="img" aria-label="Young people taking part in a community activity" />
    </div></section>
    <section className="section section-muted"><div className="container pillars-grid">
      <article><p className="eyebrow">Our mission</p><h2>Empower people and communities</h2><p>{settings.mission}</p></article>
      <article><p className="eyebrow">Our vision</p><h2>A peaceful, inclusive society</h2><p>{settings.vision}</p></article>
      <article><p className="eyebrow">Our values</p><h2>How we work</h2><p>Peace and non-violence; youth leadership and participation; inclusion and equality; accountability and transparency; community ownership; and human dignity.</p></article>
    </div></section></PublicLayout>;
}
