import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { publicOrganizationSettings } from "@/lib/public-data";

export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await publicOrganizationSettings();
  return <><SiteHeader settings={settings} /><main>{children}</main><SiteFooter settings={settings} /></>;
}

export function PageIntro({
  title,
  description,
  eyebrow = "Youth for Peace and Prosperous",
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-intro-copy">{description}</p>
      </div>
    </section>
  );
}

export function CollectionSection({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  action?: { label: string; href: string };
}) {
  return (
    <section className="section">
      <div className="container">
        {(title || action) && <div className="section-heading">{title && <h2>{title}</h2>}{action && <Link className="text-link" href={action.href}>{action.label} →</Link>}</div>}
        {children}
      </div>
    </section>
  );
}

export function DatabaseMessage() {
  return <p className="empty-state">Content is not available right now. Please try again later.</p>;
}
