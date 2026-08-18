import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import type { SkillGapItem, SkillGapStatus } from '../types/domain';
import { getSkillGap } from '../services/skillGap';

interface SkillGapPageProps {
  careerId?: string;
  onNavigate: (href: string) => void;
}

const statusLabels: Record<SkillGapStatus, string> = {
  matched: 'Already matched',
  missing: 'Build next',
};

const levelLabels: Record<SkillGapItem['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function SkillGroup({
  title,
  description,
  skills,
  status,
}: {
  title: string;
  description: string;
  skills: SkillGapItem[];
  status: SkillGapStatus;
}) {
  return (
    <Card className={`skill-gap-group skill-gap-group--${status}`}>
      <div className="skill-gap-group__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Badge tone={status === 'matched' ? 'success' : 'warning'}>
          {skills.length}
        </Badge>
      </div>
      {skills.length > 0 ? (
        <ul className="skill-gap-list">
          {skills.map((skill) => (
            <li key={`${skill.name}-${skill.level}`} className="skill-gap-list__item">
              <span className="skill-gap-list__name">{skill.name}</span>
              <span className="skill-gap-list__level">{levelLabels[skill.level]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-gap-group__empty">Nothing in this category right now.</p>
      )}
    </Card>
  );
}

export function SkillGapPage({ careerId, onNavigate }: SkillGapPageProps) {
  const [skills, setSkills] = useState<SkillGapItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSkillGap = useCallback(() => {
    if (!careerId) {
      setStatus('error');
      setErrorMessage('A career is required to calculate a skill gap.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    getSkillGap(careerId)
      .then((response) => {
        setSkills(response.skills);
        setStatus(response.skills.length > 0 ? 'success' : 'empty');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'The skill gap could not be loaded.',
        );
      });
  }, [careerId]);

  useEffect(() => {
    loadSkillGap();
  }, [loadSkillGap]);

  const groups = useMemo(
    () => ({
      matched: skills.filter((skill) => skill.status === 'matched'),
      missing: skills.filter((skill) => skill.status === 'missing'),
    }),
    [skills],
  );
  const matchedCount = groups.matched.length;
  const progress = skills.length === 0 ? 0 : Math.round((matchedCount / skills.length) * 100);

  return (
    <div className="page-frame skill-gap-page">
      <header className="page-frame__header skill-gap-page__header">
        <div>
          <p className="eyebrow">Your capability map</p>
          <h1>Understand your skill gap</h1>
          <p>
            See the strengths you already bring to this path and the focused skills that can move
            you closer to your next career experiment.
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
          label="Mapping your skills"
          description="We are comparing your profile with the selected career requirements."
        />
      )}
      {status === 'error' && (
        <ErrorState
          title="We could not map this skill gap"
          description={errorMessage}
          actionLabel="Try again"
          onAction={loadSkillGap}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="No skill requirements found"
          description="This career does not have a skill map available yet. Return to the career catalog to explore another path."
          actionLabel="Browse career paths"
          onAction={() => onNavigate('/careers')}
        />
      )}
      {status === 'success' && (
        <>
          <section className="skill-gap-overview" aria-label="Skill gap summary">
            <Card className="skill-gap-overview__card">
              <div>
                <p className="section-kicker">Current alignment</p>
                <p className="skill-gap-overview__value">{progress}%</p>
                <p className="skill-gap-overview__description">
                  {matchedCount} of {skills.length} required skills match your current profile.
                </p>
              </div>
              <ProgressBar value={progress} label="Current skill alignment" />
            </Card>
            <div className="skill-gap-overview__stats">
              <div>
                <span>{groups.matched.length}</span>
                <small>{statusLabels.matched}</small>
              </div>
              <div>
                <span>{groups.missing.length}</span>
                <small>{statusLabels.missing}</small>
              </div>
            </div>
          </section>

          <section className="skill-gap-groups" aria-label="Skill gap details">
            <SkillGroup
              title="Strengths to carry forward"
              description="These skills already appear in your profile and can anchor your next step."
              skills={groups.matched}
              status="matched"
            />
            <SkillGroup
              title="Priority skills to build"
              description="Start here when choosing learning resources or roadmap activities."
              skills={groups.missing}
              status="missing"
            />
          </section>

          <aside className="skill-gap-next-step" aria-label="Skill gap next step">
            <div>
              <p className="section-kicker">A practical next step</p>
              <h2>Turn the gap into a plan.</h2>
              <p>
                Use the priority skills above to choose the next roadmap step that feels achievable.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => onNavigate(`/careers/${encodeURIComponent(careerId ?? '')}/roadmap`)}
            >
              Open learning roadmap <span aria-hidden="true">↗</span>
            </Button>
          </aside>
        </>
      )}
    </div>
  );
}
