import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import type { Recommendation } from '../types/domain';
import { getRecommendations } from '../services/recommendations';

interface RecommendationsPageProps {
  onNavigate: (href: string) => void;
}

function CareerMapNode({
  recommendation,
  position,
  onSelect,
}: {
  recommendation: Recommendation;
  position: number;
  onSelect: () => void;
}) {
  const positionClass = position <= 5 ? `career-map__node--${position}` : 'career-map__node--extra';

  return (
    <li className={`career-map__node ${positionClass}`}>
      <button
        className="career-map__node-button"
        type="button"
        onClick={onSelect}
        aria-label={`Open Job Insights for ${recommendation.career}`}
      >
        <span className="career-map__node-index" aria-hidden="true">
          {String(position).padStart(2, '0')}
        </span>
        <span className="career-map__node-copy">
          <strong>{recommendation.career}</strong>
          <span>Explore this path</span>
        </span>
        <span className="career-map__node-arrow" aria-hidden="true">
          ↗
        </span>
      </button>
    </li>
  );
}

function buildJobInsightsDetailPath(careerId: string) {
  const resultId = new URLSearchParams(window.location.search).get('resultId');
  const query = resultId ? `?resultId=${encodeURIComponent(resultId)}` : '';
  return `/job-insights/${encodeURIComponent(careerId)}${query}`;
}

export function RecommendationsPage({ onNavigate }: RecommendationsPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadRecommendations = useCallback(() => {
    setStatus('loading');
    setErrorMessage('');
    const requestedResultId =
      new URLSearchParams(window.location.search).get('resultId') ?? undefined;

    getRecommendations(requestedResultId)
      .then((response) => {
        setRecommendations(response.recommendations);
        setStatus(response.recommendations.length > 0 ? 'success' : 'empty');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Job Insights could not be loaded.',
        );
      });
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <div className="page-frame recommendations-page recommendations-page--minimal">
      <header className="page-frame__header recommendations-page__header">
        <p className="eyebrow">Career direction</p>
        <h1>Job Insights</h1>
        <p className="recommendations-page__intro">
          Choose a path to explore your skill profile and find live opportunities that match your
          direction.
        </p>
      </header>

      {status === 'loading' && (
        <LoadingState
          label="Loading Job Insights"
          description="Preparing your recommended career paths."
        />
      )}
      {status === 'error' && (
        <ErrorState
          title="Job Insights could not be loaded"
          description={errorMessage || 'Complete an assessment before opening Job Insights.'}
          actionLabel="Try again"
          onAction={loadRecommendations}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="No career paths yet"
          description="Complete an assessment to see career paths and job-search options."
          actionLabel="Start assessment"
          onAction={() => onNavigate('/assessment')}
        />
      )}
      {status === 'success' && (
        <section className="career-map" aria-labelledby="career-map-title">
          <div className="career-map__canvas">
            <svg
              className="career-map__connections"
              viewBox="0 0 1000 560"
              role="img"
              aria-labelledby="career-map-title career-map-description"
            >
              <title id="career-map-title">Recommended career paths</title>
              <desc id="career-map-description">
                Connected career paths. Select a career to open its Job Insights detail page.
              </desc>
              <path d="M238 190 C360 140 445 145 542 206" />
              <path d="M542 206 C650 140 748 139 835 188" />
              <path d="M238 190 C268 290 292 338 350 382" />
              <path d="M350 382 C430 382 482 335 542 206" />
              <path d="M542 206 C600 310 684 370 760 442" />
              <path d="M350 382 C510 430 650 458 760 442" />
            </svg>
            <ul className="career-map__nodes" aria-label="Career paths">
              {recommendations.map((recommendation, index) => (
                <CareerMapNode
                  key={recommendation.careerId}
                  recommendation={recommendation}
                  position={index + 1}
                  onSelect={() => onNavigate(buildJobInsightsDetailPath(recommendation.careerId))}
                />
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
