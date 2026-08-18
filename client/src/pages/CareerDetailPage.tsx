import { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { getCareer } from '../services/careers';
import type { CareerDetail } from '../types/domain';

interface CareerDetailPageProps {
  careerId?: string;
  onNavigate: (href: string) => void;
}

export function CareerDetailPage({ careerId, onNavigate }: CareerDetailPageProps) {
  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCareer = () => {
    if (!careerId) {
      setCareer(null);
      setErrorMessage('This career path does not have a valid identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    getCareer(careerId)
      .then(setCareer)
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Career details could not be loaded. Please try again.',
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCareer();
  }, [careerId]);

  if (isLoading) {
    return (
      <div className="page-frame career-page">
        <LoadingState
          label="Loading career details"
          description="We are preparing the skills, resources, roadmap, and available environment."
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="page-frame career-page">
        <ErrorState
          title="This career path needs another look"
          description={errorMessage}
          onAction={loadCareer}
        />
        <button
          className="text-link page-back-link"
          type="button"
          onClick={() => onNavigate('/careers')}
        >
          ← Back to career paths
        </button>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="page-frame career-page">
        <EmptyState
          title="Career details are unavailable"
          description="Return to the catalog and choose a career path to explore."
          actionLabel="Browse career paths"
          onAction={() => onNavigate('/careers')}
        />
      </div>
    );
  }

  return (
    <div className="page-frame career-page career-detail-page">
      <button
        className="text-link page-back-link"
        type="button"
        onClick={() => onNavigate('/careers')}
      >
        ← Back to career paths
      </button>

      <section className="career-detail-hero">
        <div>
          <p className="eyebrow">Career path</p>
          <h1>{career.name}</h1>
          <p className="page-lead">{career.description}</p>
        </div>
        <div className="career-detail-hero__actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('/assessment')}
          >
            Take the assessment <span aria-hidden="true">↗</span>
          </button>
          <button
            className="outline-button"
            type="button"
            onClick={() => onNavigate(`/careers/${encodeURIComponent(career.id)}/roadmap`)}
          >
            View roadmap
          </button>
        </div>
      </section>

      <section className="career-detail-grid">
        <Card title="Skills to build" description="The capabilities connected to this career path.">
          {career.skills.length > 0 ? (
            <div className="career-detail__tags">
              {career.skills.map((skill) => (
                <Badge key={skill} tone="info">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="muted-text">Skill details will be added as the catalog grows.</p>
          )}
        </Card>

        <Card
          title="Immersive environment"
          description="VR is an optional layer, not a requirement for a career path."
        >
          {career.environment?.available ? (
            <div className="environment-card">
              <Badge tone="success">Available now</Badge>
              <h2>{career.environment.title}</h2>
              <p>{career.environment.description}</p>
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  onNavigate(`/vr?environment=${encodeURIComponent(career.environment?.key ?? '')}`)
                }
              >
                Explore this environment <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <div className="environment-card environment-card--unavailable">
              <Badge tone="neutral">Catalog only</Badge>
              <h2>No VR environment yet</h2>
              <p>
                This career remains fully supported in the guidance system. An immersive environment
                can be added later without changing this career path or its roadmap.
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="career-detail-grid career-detail-grid--lower">
        <Card
          title="Learning resources"
          description="Curated starting points for exploring this direction."
        >
          {career.learningResources.length > 0 ? (
            <div className="resource-list">
              {career.learningResources.map((resource) => (
                <a
                  key={`${resource.title}-${resource.url ?? 'resource'}`}
                  className="resource-item"
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    <strong>{resource.title}</strong>
                    {resource.description && <small>{resource.description}</small>}
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              Learning resources will appear here as this path is expanded.
            </p>
          )}
        </Card>

        <Card
          title="Roadmap preview"
          description="A quick view of the ordered steps connected to this career."
        >
          {career.roadmap.length > 0 ? (
            <ol className="roadmap-preview">
              {career.roadmap.slice(0, 4).map((step) => (
                <li key={step.id}>
                  <span className="roadmap-preview__number">{step.displayOrder}</span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.skill}</small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted-text">A roadmap will appear here as learning steps are added.</p>
          )}
          {career.roadmap.length > 4 && (
            <button
              className="text-link"
              type="button"
              onClick={() => onNavigate(`/careers/${encodeURIComponent(career.id)}/roadmap`)}
            >
              See all roadmap steps <span aria-hidden="true">↗</span>
            </button>
          )}
        </Card>
      </section>
    </div>
  );
}
