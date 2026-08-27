import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { getCareers } from '../services/careers';
import type { CareerSummary } from '../types/domain';

interface CareerCatalogPageProps {
  onNavigate: (href: string) => void;
}

export function CareerCatalogPage({ onNavigate }: CareerCatalogPageProps) {
  const [careers, setCareers] = useState<CareerSummary[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCareers = () => {
    setIsLoading(true);
    setErrorMessage(null);
    getCareers()
      .then(setCareers)
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Career paths could not be loaded. Please try again.',
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCareers();
  }, []);

  const filteredCareers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return careers;

    return careers.filter((career) =>
      [career.name, career.description, ...career.skills]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [careers, search]);

  return (
    <div className="page-frame career-page">
      <section className="career-hero">
        <div>
          <p className="eyebrow">Explore the wider landscape</p>
          <h1>
            Career paths for your <em>next chapter.</em>
          </h1>
          <p className="page-lead">
            Pathfinder keeps the catalog broad so you can compare directions across domains. Some
            paths have an immersive environment today; every path can still lead to a meaningful
            assessment, recommendation, and learning roadmap.
          </p>
        </div>
        <div className="career-hero__art">
          <div className="career-hero__art-frame">
            <img
              src="/assets/assessment-discovery-reference.png"
              alt="A soft green landscape with signposts for strengths, interests, work style, and growth."
            />
          </div>
        </div>
        <div className="career-hero__stat" aria-label={`${careers.length} career paths available`}>
          <strong>{careers.length}</strong>
          <span>paths to explore</span>
        </div>
      </section>

      <section className="career-toolbar" aria-label="Career catalog controls">
        <label className="career-search">
          <span>Search by career or skill</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try design, data, security..."
          />
        </label>
        <p className="career-toolbar__count" aria-live="polite">
          {filteredCareers.length} of {careers.length} shown
        </p>
      </section>

      {isLoading && (
        <LoadingState
          label="Loading career paths"
          description="We are gathering the current catalog and its optional immersive metadata."
        />
      )}

      {!isLoading && errorMessage && (
        <ErrorState
          title="Career paths are taking a moment"
          description={errorMessage}
          onAction={loadCareers}
        />
      )}

      {!isLoading && !errorMessage && careers.length === 0 && (
        <EmptyState
          title="No career paths yet"
          description="The catalog is empty right now. Try again later as new paths are added."
          actionLabel="Refresh catalog"
          onAction={loadCareers}
        />
      )}

      {!isLoading && !errorMessage && careers.length > 0 && filteredCareers.length === 0 && (
        <EmptyState
          title="No matching career paths"
          description="Try a broader career name or skill, or clear the search to view the full catalog."
          actionLabel="Clear search"
          onAction={() => setSearch('')}
        />
      )}

      {!isLoading && !errorMessage && filteredCareers.length > 0 && (
        <section className="career-grid" aria-label="Career paths">
          {filteredCareers.map((career) => (
            <Card key={career.id} className="career-card">
              <div className="career-card__topline">
                <span className="career-card__index" aria-hidden="true">
                  {String(filteredCareers.indexOf(career) + 1).padStart(2, '0')}
                </span>
                {career.environmentKey && <Badge tone="info">Immersive available</Badge>}
              </div>
              <h2 className="career-card__title">{career.name}</h2>
              <p className="career-card__description">{career.description}</p>
              <div className="career-card__skills" aria-label={`${career.name} skills`}>
                {career.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
                {career.skills.length > 4 && <Badge>+{career.skills.length - 4} more</Badge>}
              </div>
              <button
                className="career-card__details-button"
                type="button"
                aria-label={`View details for ${career.name}`}
                onClick={() => onNavigate(`/careers/${encodeURIComponent(career.id)}`)}
              >
                <span>View career details</span>
                <span className="career-card__details-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
