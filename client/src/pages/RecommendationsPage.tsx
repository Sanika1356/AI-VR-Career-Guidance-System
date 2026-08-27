import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import type { Recommendation } from '../types/domain';
import { getRecommendations } from '../services/recommendations';

interface RecommendationsPageProps {
  onNavigate: (href: string) => void;
}

function CareerPathRow({
  recommendation,
  position,
  onSelect,
}: {
  recommendation: Recommendation;
  position: number;
  onSelect: () => void;
}) {
  return (
    <Card className="recommendation-card recommendation-card--path">
      <button
        className="recommendation-card__path-button"
        type="button"
        onClick={onSelect}
        aria-label={`Open Job Insights for ${recommendation.career}`}
      >
        <span className="recommendation-card__path-index" aria-hidden="true">
          {String(position).padStart(2, '0')}
        </span>
        <span className="recommendation-card__path-name">{recommendation.career}</span>
        <span className="recommendation-card__path-arrow" aria-hidden="true">
          ↗
        </span>
      </button>
    </Card>
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
        <section
          className="recommendations-list recommendations-list--paths"
          aria-label="Career paths"
        >
          {recommendations.map((recommendation, index) => (
            <CareerPathRow
              key={recommendation.careerId}
              recommendation={recommendation}
              position={index + 1}
              onSelect={() => onNavigate(buildJobInsightsDetailPath(recommendation.careerId))}
            />
          ))}
        </section>
      )}
    </div>
  );
}
