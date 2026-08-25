import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import type { AssessmentExplanation, Recommendation } from '../types/domain';
import { getAssessmentResult } from '../services/assessment';
import { getRecommendations } from '../services/recommendations';

interface RecommendationsPageProps {
  onNavigate: (href: string) => void;
}

function SkillList({ skills, tone }: { skills: string[]; tone: 'matched' | 'missing' }) {
  if (skills.length === 0) {
    return <p className="recommendation-skills__empty">No skills in this category yet.</p>;
  }

  return (
    <ul className={`recommendation-skills recommendation-skills--${tone}`}>
      {skills.map((skill) => (
        <li key={skill}>{skill}</li>
      ))}
    </ul>
  );
}

function RecommendationCard({
  recommendation,
  rank,
  onNavigate,
}: {
  recommendation: Recommendation;
  rank: number;
  onNavigate: (href: string) => void;
}) {
  const score = Math.max(0, Math.min(100, recommendation.score));

  return (
    <Card className="recommendation-card">
      <div className="recommendation-card__topline">
        <Badge tone={rank === 1 ? 'success' : 'neutral'}>
          {rank === 1 ? 'Top match' : `Rank ${rank}`}
        </Badge>
        <span className="recommendation-card__score" aria-label={`${score}% match`}>
          {Math.round(score)}%
        </span>
      </div>
      <div className="recommendation-card__summary">
        <h2 className="recommendation-card__title">{recommendation.career}</h2>
        <p className="recommendation-card__reason">{recommendation.reason}</p>
      </div>
      <div className="recommendation-card__match">
        <ProgressBar value={score} label={`${recommendation.career} match strength`} />
        <div
          className="recommendation-evidence"
          aria-label={`${recommendation.career} scoring evidence`}
        >
          <Badge tone={recommendation.evidence.confidence === 'high' ? 'success' : 'neutral'}>
            {recommendation.evidence.confidence} confidence
          </Badge>
          <span>
            {recommendation.evidence.matchedSkillCount} matched skill
            {recommendation.evidence.matchedSkillCount === 1 ? '' : 's'} ·{' '}
            {recommendation.evidence.missingSkillCount} to develop
          </span>
        </div>
      </div>
      <ul className="recommendation-tradeoffs" aria-label={`${recommendation.career} trade-offs`}>
        {recommendation.evidence.tradeOffs.map((tradeOff) => (
          <li key={tradeOff}>{tradeOff}</li>
        ))}
      </ul>
      <div className="recommendation-card__skills">
        <div>
          <h3>Skills you bring</h3>
          <SkillList skills={recommendation.matchedSkills} tone="matched" />
        </div>
        <div>
          <h3>Skills to develop</h3>
          <SkillList skills={recommendation.missingSkills} tone="missing" />
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        onClick={() => onNavigate(`/careers/${encodeURIComponent(recommendation.careerId)}`)}
      >
        Explore career details <span aria-hidden="true">↗</span>
      </Button>
    </Card>
  );
}

function ExplanationCard({
  explanation,
  careerName,
}: {
  explanation: AssessmentExplanation;
  careerName: string;
}) {
  return (
    <Card className="assessment-explanation-card">
      <div className="recommendation-card__topline">
        <Badge tone={explanation.confidence === 'high' ? 'success' : 'neutral'}>
          {explanation.confidence} confidence signal
        </Badge>
        <span>{careerName}</span>
      </div>
      <h2>Why this path appeared</h2>
      {explanation.supportingSignals.length > 0 ? (
        <ul>
          {explanation.supportingSignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      ) : (
        <p>No single answer provided a strong direct signal for this path.</p>
      )}
      <p className="recommendation-card__reason">{explanation.caveat}</p>
    </Card>
  );
}

export function RecommendationsPage({ onNavigate }: RecommendationsPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [explanations, setExplanations] = useState<AssessmentExplanation[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadRecommendations = useCallback(() => {
    setStatus('loading');
    setErrorMessage('');
    setExplanations([]);
    const requestedResultId =
      new URLSearchParams(window.location.search).get('resultId') ?? undefined;

    getRecommendations(requestedResultId)
      .then((response) => {
        setResultId(response.resultId);
        setRecommendations(response.recommendations);
        setStatus(response.recommendations.length > 0 ? 'success' : 'empty');
        void getAssessmentResult(response.resultId)
          .then((result) => setExplanations(result.explanations ?? []))
          .catch(() => setExplanations([]));
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Recommendations could not be loaded.',
        );
      });
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <div className="page-frame recommendations-page">
      <header className="page-frame__header recommendations-page__header">
        <div>
          <p className="eyebrow">Your next possibilities</p>
          <h1>Career recommendations</h1>
          <p>
            These paths are ranked from your assessment signals and current skills. Use them as
            thoughtful starting points, not as a guarantee of what you should become.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => onNavigate('/assessment')}>
          Retake assessment
        </Button>
      </header>

      {resultId && status === 'success' && (
        <div className="recommendations-page__summary" role="status">
          <span className="recommendations-page__summary-mark" aria-hidden="true">
            ✓
          </span>
          <p>
            Ranked from your latest assessment. Your strongest match appears first, and every path
            includes a practical skills gap to explore.
          </p>
        </div>
      )}

      {status === 'loading' && (
        <LoadingState
          label="Finding your strongest paths"
          description="We are comparing your assessment signals with the career catalog."
        />
      )}
      {status === 'error' && (
        <ErrorState
          title="Recommendations are taking a detour"
          description={errorMessage || 'Complete an assessment before requesting recommendations.'}
          actionLabel="Try again"
          onAction={loadRecommendations}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="No recommendations yet"
          description="Complete an assessment to see career paths matched to your interests and current skills."
          actionLabel="Start assessment"
          onAction={() => onNavigate('/assessment')}
        />
      )}
      {status === 'success' && explanations.length > 0 && (
        <section className="assessment-explanations" aria-label="Assessment evidence explanations">
          <div>
            <p className="eyebrow">Evidence, not certainty</p>
            <h2>What influenced these signals</h2>
            <p>
              These are the answers that contributed to each path. You can question or revise them
              by retaking the assessment.
            </p>
          </div>
          {explanations.map((explanation) => (
            <ExplanationCard
              key={explanation.careerId}
              explanation={explanation}
              careerName={
                recommendations.find((item) => item.careerId === explanation.careerId)?.career ??
                explanation.careerId
              }
            />
          ))}
        </section>
      )}

      {status === 'success' && (
        <section className="recommendations-list" aria-label="Ranked career recommendations">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.careerId}
              recommendation={recommendation}
              rank={index + 1}
              onNavigate={onNavigate}
            />
          ))}
        </section>
      )}

      <aside className="guidance-note" aria-label="Career guidance note">
        <span className="guidance-note__mark" aria-hidden="true">
          i
        </span>
        <div>
          <h2>Keep your options open</h2>
          <p>
            A recommendation is a useful signal, not a fixed destination. Compare paths, talk with
            people in the field, and use the skill gaps to decide what to try next.
          </p>
        </div>
      </aside>
    </div>
  );
}
