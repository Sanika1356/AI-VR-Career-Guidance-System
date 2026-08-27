import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { JOB_MARKET_PLATFORMS } from '../lib/jobMarket';
import type { Recommendation } from '../types/domain';
import { getRecommendations } from '../services/recommendations';

interface RecommendationsPageProps {
  onNavigate: (href: string) => void;
}

function JobMarketChooser({ role }: { role: string }) {
  return (
    <details className="job-opportunity__chooser">
      <summary className="job-opportunity__apply-button">
        Apply for jobs <span aria-hidden="true">↗</span>
      </summary>
      <div className="job-opportunity__links" aria-label={`${role} job platforms`}>
        {JOB_MARKET_PLATFORMS.map((platform) => (
          <a
            className="job-opportunity__link"
            href={platform.buildUrl(role)}
            key={platform.label}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>{platform.label}</strong>
              <small>{platform.description}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </details>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <Card className="recommendation-card recommendation-card--minimal">
      <div className="recommendation-card__minimal-content">
        <h2>{recommendation.career}</h2>
        <JobMarketChooser role={recommendation.career} />
      </div>
    </Card>
  );
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
        <h1>Job Insights</h1>
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
        <section className="recommendations-list" aria-label="Career paths">
          {recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.careerId} recommendation={recommendation} />
          ))}
        </section>
      )}
    </div>
  );
}
