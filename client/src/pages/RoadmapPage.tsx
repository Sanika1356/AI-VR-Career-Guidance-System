import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import { getRoadmap, updateRoadmapStep } from '../services/roadmap';
import type { RoadmapResponse, RoadmapStep } from '../types/domain';

interface RoadmapPageProps {
  careerId?: string;
  onNavigate: (href: string) => void;
}

function RoadmapStepCard({
  step,
  isUpdating,
  onToggle,
}: {
  step: RoadmapStep;
  isUpdating: boolean;
  onToggle: (step: RoadmapStep) => void;
}) {
  const descriptionId = `roadmap-step-description-${step.id}`;

  return (
    <li className={`roadmap-step ${step.completed ? 'roadmap-step--completed' : ''}`}>
      <div className="roadmap-step__marker" aria-hidden="true">
        {step.completed ? '✓' : step.order}
      </div>
      <div className="roadmap-step__content">
        <div className="roadmap-step__header">
          <div>
            <p className="section-kicker">Step {step.order}</p>
            <h2>{step.title}</h2>
          </div>
          <Badge tone={step.completed ? 'success' : 'neutral'}>
            {step.completed ? 'Complete' : 'Up next'}
          </Badge>
        </div>
        <p id={descriptionId} className="roadmap-step__description">
          {step.description}
        </p>
        <div className="roadmap-step__footer">
          <span className="roadmap-step__skill">Focus skill: {step.skill}</span>
          <label className="roadmap-step__toggle">
            <input
              type="checkbox"
              checked={step.completed}
              disabled={isUpdating}
              aria-describedby={descriptionId}
              onChange={() => onToggle(step)}
            />
            <span>
              {isUpdating ? 'Saving…' : step.completed ? 'Mark incomplete' : 'Mark complete'}
            </span>
          </label>
        </div>
      </div>
    </li>
  );
}

export function RoadmapPage({ careerId, onNavigate }: RoadmapPageProps) {
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  const loadRoadmap = useCallback(() => {
    if (!careerId) {
      setStatus('error');
      setErrorMessage('A career is required to build a learning roadmap.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setActionError('');
    getRoadmap(careerId)
      .then((response) => {
        setRoadmap(response);
        setStatus(response.steps.length > 0 ? 'success' : 'empty');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'The learning roadmap could not be loaded.',
        );
      });
  }, [careerId]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const completedCount = useMemo(
    () => roadmap?.steps.filter((step) => step.completed).length ?? 0,
    [roadmap],
  );
  const totalSteps = roadmap?.steps.length ?? 0;
  const progress = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  const handleToggle = (step: RoadmapStep) => {
    if (updatingStepId) return;

    const completed = !step.completed;
    setUpdatingStepId(step.id);
    setActionError('');
    updateRoadmapStep(step.id, { completed })
      .then((response) => {
        setRoadmap((current) =>
          current
            ? {
                ...current,
                steps: current.steps.map((currentStep) =>
                  currentStep.id === response.stepId
                    ? { ...currentStep, completed: response.completed }
                    : currentStep,
                ),
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'This progress update could not be saved. Please try again.',
        );
      })
      .finally(() => setUpdatingStepId(null));
  };

  return (
    <div className="page-frame roadmap-page">
      <header className="page-frame__header roadmap-page__header">
        <div>
          <p className="eyebrow">Your learning path</p>
          <h1>Build your roadmap.</h1>
          <p>
            Move through focused steps at a pace that feels achievable. Mark progress as you build
            the skills connected to this career path.
          </p>
        </div>
        {careerId && (
          <Button
            variant="outline"
            type="button"
            onClick={() => onNavigate(`/careers/${careerId}`)}
          >
            Back to career details
          </Button>
        )}
      </header>

      {status === 'loading' && (
        <LoadingState
          label="Loading your roadmap"
          description="We are arranging the learning steps for this career path."
        />
      )}
      {status === 'error' && (
        <ErrorState
          title="We could not load this roadmap"
          description={errorMessage}
          actionLabel="Try again"
          onAction={loadRoadmap}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="This roadmap is still taking shape"
          description="There are no learning steps for this career yet. Return to the career catalog to explore another path."
          actionLabel="Browse career paths"
          onAction={() => onNavigate('/careers')}
        />
      )}
      {status === 'success' && roadmap && (
        <>
          <section className="roadmap-overview" aria-label="Roadmap progress">
            <Card className="roadmap-overview__card">
              <div>
                <p className="section-kicker">Current progress</p>
                <p className="roadmap-overview__value">{progress}%</p>
                <p className="roadmap-overview__description">
                  {completedCount} of {totalSteps} roadmap steps completed.
                </p>
              </div>
              <ProgressBar value={progress} label="Roadmap completion" />
            </Card>
            <div className="roadmap-overview__stats">
              <div>
                <span>{completedCount}</span>
                <small>Completed</small>
              </div>
              <div>
                <span>{totalSteps - completedCount}</span>
                <small>Still to build</small>
              </div>
            </div>
          </section>

          {actionError && (
            <p className="roadmap-action-error" role="alert">
              {actionError}
            </p>
          )}

          <ol className="roadmap-steps" aria-label="Ordered learning roadmap">
            {roadmap.steps.map((step) => (
              <RoadmapStepCard
                key={step.id}
                step={step}
                isUpdating={updatingStepId === step.id}
                onToggle={handleToggle}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
