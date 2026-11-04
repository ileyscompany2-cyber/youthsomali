import Link from "next/link";
import Image from "next/image";
import { PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { PublicCards } from "@/components/PublicContent";
import { publicOrganizationSettings, publishedHomeContent } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, settings] = await Promise.all([
    publishedHomeContent(),
    publicOrganizationSettings(),
  ]);
  const { programs, programCount, projects, articles, photos } = content;

  const organizationSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NGO",
    name: "Youth for Peace and Prosperous (YPP)",
    url: process.env.APP_URL ?? "http://127.0.0.1:3000",
    foundingDate: "2017-02-05",
    email: settings.email,
    telephone: settings.phone,
    areaServed: settings.location,
    description: settings.mission,
  }).replace(/</g, "\\u003c");

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationSchema }} />
      <section className="hero home-hero">
        <Image
          className="home-hero-photo"
          src="/images/gallery/1F6A1056.webp"
          alt="Young people and community members gathered in Somalia"
          fill
          priority
          sizes="100vw"
        />
        <div className="container"><div className="hero-content">
          <p className="eyebrow">Youth for Peace and Prosperous · Somalia</p>
          <h1>Young people shaping a more peaceful and prosperous future</h1>
          <p className="hero-copy">{settings.mission}</p>
          <div className="hero-actions"><Link className="button button-gold" href="/programs">Explore our programs</Link><Link className="button button-outline" href="/contact">Work with YPP</Link></div>
          <p className="hero-location">{settings.location}</p>
        </div></div>
      </section>

      <section className="facts-strip" aria-label="Verified information about YPP">
        <div className="container facts-grid">
          <div><span>Established</span><strong>5 February 2017</strong></div>
          <div><span>Published program areas</span><strong>{programCount}</strong></div>
          <div><span>Where we work</span><strong>Southwest State &amp; Mogadishu</strong></div>
        </div>
      </section>

      <section className="section section-story">
        <div className="container split">
          <div className="split-copy">
            <p className="eyebrow">About YPP</p>
            <h2>Peacebuilding shaped by young people and their communities</h2>
            <p>Established on 5 February 2017, Youth for Peace and Prosperous works in Southwest State of Somalia and Mogadishu. YPP supports young people and communities through peacebuilding, leadership, capacity development, and inclusive initiatives.</p>
            <Link className="link-arrow" href="/about">Discover our story <span aria-hidden="true">→</span></Link>
          </div>
          <figure className="story-photo">
            <Image src="/images/gallery/1F6A1054.webp" alt="Youth and community members at a YPP gathering" width={1280} height={850} sizes="(max-width: 760px) 100vw, 50vw" />
            <figcaption>Young people and communities in conversation</figcaption>
          </figure>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-heading section-heading-intro"><div><p className="eyebrow">What guides us</p><h2>Our mission, vision and values</h2></div><Link className="link-arrow" href="/about">About YPP <span aria-hidden="true">→</span></Link></div>
          <div className="pillars-grid home-pillars">
            <article className="pillar"><span className="pillar-number">01</span><h3>Our mission</h3><p>{settings.mission}</p></article>
            <article className="pillar"><span className="pillar-number">02</span><h3>Our vision</h3><p>{settings.vision}</p></article>
            <article className="pillar"><span className="pillar-number">03</span><h3>Our values</h3><p>Peace and non-violence; youth leadership and participation; inclusion and equality; accountability and transparency; community ownership; and human dignity.</p></article>
          </div>
        </div>
      </section>

      <CollectionSection title="Our programs" action={{ label: "Explore all programs", href: "/programs" }}>
        <p className="section-intro">Seven program areas focused on peacebuilding, youth participation, and inclusive community development.</p>
        <PublicCards items={programs} kind="programs" emptyMessage="Program information is being prepared for publication." />
      </CollectionSection>

      <section className="section section-beneficiaries">
        <div className="container beneficiaries-inner">
          <div><p className="eyebrow">Inclusive by design</p><h2>Working alongside communities</h2><p>YPP&apos;s initiatives are intended to include people and communities who are often underrepresented.</p></div>
          <ul className="beneficiary-list" aria-label="Communities YPP works to include">
            <li>Youth</li><li>Women</li><li>Vulnerable communities</li><li>Persons with disabilities</li><li>Internally displaced people</li>
          </ul>
        </div>
      </section>

      <CollectionSection title="Moments from our community" action={{ label: "View the full gallery", href: "/gallery" }}>
        {photos.length ? <div className="home-gallery">{photos.map(photo => <Link className="home-gallery-item" href="/gallery" key={photo.id} aria-label={`View the photo gallery: ${photo.altText}`}>
          <Image src={photo.imageUrl} alt={photo.altText} width={760} height={520} sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" />
        </Link>)}</div> : <p className="empty-state">YPP photographs will appear here when published.</p>}
      </CollectionSection>

      {projects.length > 0 && <CollectionSection title="Featured projects" action={{ label: "View all projects", href: "/projects" }}>
        <PublicCards items={projects} emptyMessage="There are no published projects yet." />
      </CollectionSection>}
      <CollectionSection title="Latest news" action={{ label: "Read all news", href: "/news" }}>
        <PublicCards items={articles} kind="news" emptyMessage="There are no published news articles yet." />
      </CollectionSection>

      <section className="cta-section"><div className="container cta-inner"><div><p className="eyebrow">Work with us</p><h2>Join efforts for peace and inclusive development</h2><p>Connect with YPP to learn about our work or discuss a partnership.</p></div><Link className="button button-gold" href="/contact">Get in touch</Link></div></section>
    </PublicLayout>
  );
}
