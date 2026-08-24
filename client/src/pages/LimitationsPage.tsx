import { Card } from '../components/Card';

interface LimitationsPageProps {
  onNavigate: (href: string) => void;
}

export function LimitationsPage({ onNavigate }: LimitationsPageProps) {
  return (
    <div className="page-frame limitations-page">
      <section className="limitations-hero" aria-labelledby="limitations-title">
        <p className="eyebrow">Pathfinder / Transparency</p>
        <h1 id="limitations-title">Useful direction, not a promise.</h1>
        <p className="page-lead">
          Pathfinder is an educational career-exploration tool. It helps you notice patterns,
          compare possibilities, and choose practical learning steps. It does not decide your future
          or replace qualified human advice.
        </p>
      </section>

      <section className="limitations-grid" aria-label="Product limitations and safeguards">
        <Card title="Assessment and recommendations" description="How to interpret your results.">
          <p>
            Assessment responses and recommendations are directional signals based on the local
            question bank, your submitted profile information, and the project&apos;s deterministic
            scoring rules. They are not psychometric diagnoses, aptitude certifications, admissions
            decisions, or guarantees of employment, income, or career success.
          </p>
          <p>
            A ranking is a starting point for reflection. Review several paths, correct information
            that does not fit you, and discuss important decisions with a trusted educator, mentor,
            or qualified professional.
          </p>
        </Card>

        <Card
          title="AI advisor boundaries"
          description="What the conversational advisor can and cannot do."
        >
          <p>
            The advisor is designed to provide grounded, general educational guidance from the
            career catalog, your approved context, and available roadmap information. It can be
            incomplete, uncertain, or wrong, and its confidence language is not a measure of your
            ability or a professional assessment.
          </p>
          <p>
            Do not use the advisor for medical, legal, financial, immigration, mental-health,
            admissions, licensing, or other high-impact decisions. Do not share passwords, payment
            details, government identifiers, or sensitive personal information in conversation.
          </p>
        </Card>

        <Card title="Resources and sources" description="How learning links should be read.">
          <p>
            Learning resources are project-curated catalog links. A verified label means the link
            was authored and recorded in the local catalog; it does not guarantee that a third-party
            page will remain available, current, free, accessible, or suitable for every learner.
          </p>
          <p>
            Resource freshness dates and license names describe the catalog record. They are not a
            substitute for checking the provider&apos;s current terms, accessibility statement,
            cost, prerequisites, or intellectual-property conditions before using a resource.
          </p>
        </Card>

        <Card
          title="VR and WebXR readiness"
          description="Immersion is optional and hardware-dependent."
        >
          <p>
            The career catalog is broader than the current VR catalog. A career can be fully
            supported without an immersive environment, and the desktop fallback is the primary
            accessible path when immersive capability is unavailable.
          </p>
          <p>
            Desktop rendering does not prove headset compatibility. Real WebXR entry, exit,
            controller behavior, comfort, performance, and touchscreen behavior require the target
            browser and physical device. Hardware-dependent validation remains separate from this
            informational page.
          </p>
        </Card>

        <Card title="Privacy and control" description="Use the controls that are available to you.">
          <p>
            The system is designed to minimize stored data, keep authentication and server secrets
            separate, and scope account-owned data to the authenticated user. Optional analytics,
            personalized AI context, and coarse VR telemetry require explicit consent where those
            controls are available.
          </p>
          <p>
            You can review your profile and use the account privacy controls after signing in. The
            export and deletion flows are account operations; keep a copy only where you have a
            legitimate reason and protect it like any other personal record.
          </p>
        </Card>
      </section>

      <section className="limitations-next" aria-labelledby="limitations-next-title">
        <div>
          <p className="section-kicker">Use the system thoughtfully</p>
          <h2 id="limitations-next-title">Explore, question, then decide.</h2>
          <p className="section-text">
            Start with curiosity, treat every result as a hypothesis, and look for evidence from
            real coursework, projects, mentors, and the requirements of the path you are
            considering.
          </p>
        </div>
        <div className="limitations-next__actions">
          <button className="primary-button" type="button" onClick={() => onNavigate('/careers')}>
            Browse career paths <span aria-hidden="true">↗</span>
          </button>
          <button className="outline-button" type="button" onClick={() => onNavigate('/profile')}>
            Review your profile
          </button>
        </div>
      </section>
    </div>
  );
}
