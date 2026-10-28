import { SiteFooter, SiteHeader } from "@/components/site";

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <section className="page-hero"><div className="page-hero-inner">
          <p className="section-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div></section>
        <div className="content-wrap" style={{ maxWidth: 880 }}>
          <div className="notice notice-info">This is an MVP information page and needs formal review by Fitness Species before production launch.</div>
          {sections.map((section) => <section key={section.title} className="dashboard-panel">
            <h2>{section.title}</h2>
            <p className="detail-description">{section.body}</p>
          </section>)}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
