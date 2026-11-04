import { notFound } from "next/navigation";
import { PageIntro, PublicLayout, CollectionSection } from "@/components/PublicLayout";
import { publishedProject } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await publishedProject(slug);
  if (!project) notFound();

  return <PublicLayout><PageIntro title={project.title} description={project.summary} eyebrow={project.program?.title ?? "YPP project"} />
    <CollectionSection><article className="detail-content">{project.imageUrl && <img className="detail-image" src={project.imageUrl} alt={project.title} />}<p className="card-meta">{project.location} · {project.projectStatus}</p><p className="preserve-lines">{project.description}</p>{project.verifiedResults && <><h2>Verified results</h2><p className="preserve-lines">{project.verifiedResults}</p></>}</article></CollectionSection>
  </PublicLayout>;
}
