import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import type { Recommendation } from '../types/domain';
import { getRecommendations } from '../services/recommendations';

interface RecommendationsPageProps {
  onNavigate: (href: string) => void;
}

const CAREER_MAP_TONES = ['sky', 'lime', 'violet', 'coral', 'gold'] as const;
const CAREER_MAP_SYMBOLS = ['⌕', '◌', '✦', '◈', '▣'] as const;

function CareerMapNode({
  recommendation,
  position,
  onSelect,
}: {
  recommendation: Recommendation;
  position: number;
  onSelect: () => void;
}) {
  const visualIndex = (position - 1) % CAREER_MAP_TONES.length;
  const positionClass = position <= 5 ? `career-map__node--${position}` : 'career-map__node--extra';

  return (
    <li className={`career-map__node ${positionClass}`} data-tone={CAREER_MAP_TONES[visualIndex]}>
      <button
        className="career-map__node-button"
        type="button"
        onClick={onSelect}
        aria-label={`Open Job Insights for ${recommendation.career}`}
      >
        <span className="career-map__node-orb" aria-hidden="true">
          <span>{CAREER_MAP_SYMBOLS[visualIndex]}</span>
        </span>
        <span className="career-map__node-copy">
          <span className="career-map__node-index">Path {String(position).padStart(2, '0')}</span>
          <strong>{recommendation.career}</strong>
          <span className="career-map__node-action">
            Explore path <b>↗</b>
          </span>
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
                A constellation of recommended career paths. Select a career to open its Job
                Insights detail page.
              </desc>
              <circle className="career-map__connection-halo" cx="500" cy="280" r="98" />
              <path d="M500 280 C420 230 315 180 170 178" />
              <path d="M500 280 C560 220 650 155 790 176" />
              <path d="M500 280 C425 330 320 385 232 402" />
              <path d="M500 280 C600 278 700 275 770 294" />
              <path d="M500 280 C595 350 700 408 820 420" />
              <circle className="career-map__connection-point" cx="500" cy="280" r="5" />
            </svg>
            <div className="career-map__hub" aria-hidden="true">
              <span>PATHFINDER</span>
              <strong>Your next move</strong>
              <small>Choose a path to explore</small>
            </div>
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
