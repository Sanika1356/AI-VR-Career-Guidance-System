import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import { getRoadmap, reorderRoadmapStep, updateRoadmapStep } from '../services/roadmap';
import type {
  RoadmapResponse,
  RoadmapStep,
  RoadmapStepStatus,
  RoadmapStepUpdate,
} from '../types/domain';

interface RoadmapPageProps {
  careerId?: string;
  onNavigate: (href: string) => void;
}

function evidenceLinksToText(links: RoadmapStep['evidenceLinks']) {
  return links.map((link) => `${link.label} | ${link.url}`).join('\n');
}

function parseEvidenceLinksText(value: string): RoadmapStep['evidenceLinks'] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('|');
      return separator < 0
        ? { label: 'Evidence', url: line }
        : { label: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
    })
    .filter((link) => link.label && link.url);
}

function RoadmapStepCard({
  step,
  isUpdating,
  onToggle,
  onUpdate,
  onMove,
  isLast,
}: {
  step: RoadmapStep;
  isUpdating: boolean;
  isLast: boolean;
  onToggle: (step: RoadmapStep) => void;
  onUpdate: (step: RoadmapStep, update: RoadmapStepUpdate) => void;
  onMove: (step: RoadmapStep, delta: number) => void;
}) {
  const descriptionId = `roadmap-step-description-${step.id}`;
  const [notesDraft, setNotesDraft] = useState(step.notes);
  const [evidenceDraft, setEvidenceDraft] = useState(evidenceLinksToText(step.evidenceLinks));

  useEffect(() => {
    setNotesDraft(step.notes);
    setEvidenceDraft(evidenceLinksToText(step.evidenceLinks));
  }, [step.notes, step.evidenceLinks]);

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
        <p className="roadmap-step__meta">
          Estimated effort: {Math.ceil(step.estimatedEffortMinutes / 60)} hour(s)
        </p>
        <p className="roadmap-step__accessibility">{step.accessibilityNote}</p>
        <div className="roadmap-step__controls">
          <label>
            <span>Status</span>
            <select
              value={step.status}
              disabled={isUpdating}
              onChange={(event) =>
                onUpdate(step, {
                  completed: event.target.value === 'completed',
                  status: event.target.value as RoadmapStepStatus,
                })
              }
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            <span>Target date</span>
            <input
              type="date"
              value={step.targetDate ?? ''}
              disabled={isUpdating}
              onChange={(event) =>
                onUpdate(step, {
                  completed: step.completed,
                  targetDate: event.target.value || null,
                })
              }
            />
          </label>
          <label className="roadmap-step__notes">
            <span>Notes</span>
            <textarea
              value={notesDraft}
              disabled={isUpdating}
              maxLength={2000}
              rows={2}
              onChange={(event) => setNotesDraft(event.target.value)}
              onBlur={() =>
                notesDraft !== step.notes &&
                onUpdate(step, { completed: step.completed, notes: notesDraft })
              }
            />
          </label>
          <label className="roadmap-step__evidence">
            <span>Evidence links</span>
            <textarea
              value={evidenceDraft}
              disabled={isUpdating}
              maxLength={10000}
              rows={2}
              placeholder="Course notes | https://example.org"
              onChange={(event) => setEvidenceDraft(event.target.value)}
              onBlur={() => {
                const evidenceLinks = parseEvidenceLinksText(evidenceDraft);
                if (JSON.stringify(evidenceLinks) !== JSON.stringify(step.evidenceLinks)) {
                  onUpdate(step, { completed: step.completed, evidenceLinks });
                }
              }}
            />
            <small>One per line: label | absolute HTTP(S) URL</small>
          </label>
        </div>
        <div className="roadmap-step__footer">
          <span className="roadmap-step__skill">Focus skill: {step.skill}</span>
          <div className="roadmap-step__order-controls" aria-label="Reorder roadmap step">
            <Button
              variant="outline"
              type="button"
              disabled={isUpdating || step.position <= 1}
              onClick={() => onMove(step, -1)}
            >
              Move up
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isUpdating || isLast}
              onClick={() => onMove(step, 1)}
            >
              Move down
            </Button>
          </div>
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
    () =>
      roadmap?.steps.filter((step) => step.completed || step.status === 'completed').length ?? 0,
    [roadmap],
  );
  const totalSteps = roadmap?.steps.length ?? 0;
  const progress = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  const handleUpdate = (step: RoadmapStep, update: RoadmapStepUpdate) => {
    if (updatingStepId) return;
    setUpdatingStepId(step.id);
    setActionError('');
    updateRoadmapStep(step.id, { ...update, completed: update.completed ?? step.completed })
      .then((response) => {
        setRoadmap((current) =>
          current
            ? {
                ...current,
                steps: current.steps.map((currentStep) =>
                  currentStep.id === response.stepId
                    ? {
                        ...currentStep,
                        completed: response.completed,
                        targetDate: response.targetDate,
                        status: response.status,
                        notes: response.notes,
                        evidenceLinks: response.evidenceLinks,
                        position: response.position ?? currentStep.position,
                      }
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

  const handleToggle = (step: RoadmapStep) => {
    handleUpdate(step, { completed: !step.completed });
  };

  const handleMove = (step: RoadmapStep, delta: number) => {
    if (updatingStepId || !roadmap) return;
    const ordered = [...roadmap.steps].sort((left, right) => left.position - right.position);
    const index = ordered.findIndex((candidate) => candidate.id === step.id);
    const neighbor = ordered[index + delta];
    if (!neighbor) return;
    setUpdatingStepId(step.id);
    setActionError('');
    reorderRoadmapStep(step.id, neighbor.position)
      .then((response) => {
        setRoadmap((current) =>
          current
            ? {
                ...current,
                steps: current.steps
                  .map((currentStep) => {
                    const updated = response.positions.find(
                      (position) => position.stepId === currentStep.id,
                    );
                    return updated ? { ...currentStep, position: updated.position } : currentStep;
                  })
                  .sort((left, right) => left.position - right.position),
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'This reorder could not be saved. Please try again.',
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
                isLast={step.position >= totalSteps}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onMove={handleMove}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
