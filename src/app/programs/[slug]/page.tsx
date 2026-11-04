import { notFound } from "next/navigation";
import { PageIntro, PublicLayout } from "@/components/PublicLayout";
import { publishedProgram } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await publishedProgram(slug);
  if (!program) notFound();

  const objectives = Array.isArray(program.objectives) ? program.objectives : [];
  const activities = Array.isArray(program.activities) ? program.activities : [];
  return (
    <PublicLayout>
      <PageIntro title={program.title} description={program.description} />
      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">What we work toward</p>
            <h2>Program objectives</h2>
            {objectives.length
              ? <ul>{objectives.map((objective, index) => <li key={`${index}-${String(objective)}`}>{String(objective)}</li>)}</ul>
              : <p>Program objectives will be added when confirmed.</p>}
            <h2>Activities</h2>
            {activities.length
              ? <ul>{activities.map((activity, index) => <li key={`${index}-${String(activity)}`}>{String(activity)}</li>)}</ul>
              : <p>Program activities will be added when confirmed.</p>}
          </div>
          {program.imageUrl && <div className="split-image"><img src={program.imageUrl} alt={program.title} loading="lazy" /></div>}
        </div>
      </section>
    </PublicLayout>
  );
}
