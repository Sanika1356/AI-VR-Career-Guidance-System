import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import { getDashboard } from '../services/dashboard';
import { getProfile } from '../services/profile';
import type { DashboardResponse, ProfileResponse } from '../types/domain';

interface DashboardPageProps {
  onNavigate: (href: string) => void;
}

function countPreferenceValues(preferences: Record<string, unknown>) {
  return Object.values(preferences).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  }).length;
}

function formatDate(value: string | null) {
  if (!value) return 'No target date';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, dashboardResponse] = await Promise.all([
        getProfile(),
        getDashboard(),
      ]);
      setProfile(profileResponse);
      setDashboard(dashboardResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load your dashboard.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const profileSummary = useMemo(() => {
    if (!profile) return null;

    const { interests, currentSkills, experience, learningPreferences } = profile.profile;
    const completedSections = [
      interests.length > 0,
      currentSkills.length > 0,
      experience.trim().length > 0,
      countPreferenceValues(learningPreferences) > 0,
    ].filter(Boolean).length;

    return {
      completedSections,
      totalSections: 4,
      completion: Math.round((completedSections / 4) * 100),
      interests: interests.length,
      skills: currentSkills.length,
      experience: experience || 'Not set',
    };
  }, [profile]);

  if (isLoading) {
    return (
      <div className="page-frame page-frame--narrow">
        <LoadingState
          label="Preparing your dashboard"
          description="Gathering your profile signals and next steps."
        />
      </div>
    );
  }

  if (error || !profile || !profileSummary || !dashboard) {
    return (
      <div className="page-frame page-frame--narrow">
        <ErrorState
          title="Your dashboard needs another look"
          description={error ?? 'We could not load the profile signals for this dashboard.'}
          onAction={() => void loadDashboard()}
        />
      </div>
    );
  }

  const firstName = profile.user.name.split(' ')[0] || 'there';
  const latest = dashboard.recommendationChanges.latest;
  const previous = dashboard.recommendationChanges.previous;

  return (
    <div className="page-frame dashboard-page">
      <header className="page-frame__header dashboard-page__header">
        <div>
          <p className="eyebrow">Your Pathfinder dashboard</p>
          <h1>Keep moving, {firstName}.</h1>
          <p className="page-frame__intro">
            Use your profile signals, assessment, and career paths to turn curiosity into a
            practical next step.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/assessment')}>
          Continue assessment <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className="dashboard-summary" aria-label="Pathfinder summary">
        <Card
          className="dashboard-summary__profile"
          title="Profile strength"
          description="A stronger profile gives your guidance more useful context."
        >
          <div className="dashboard-summary__metric">
            <strong>{profileSummary.completion}%</strong>
            <span>
              {profileSummary.completedSections} of {profileSummary.totalSections} sections ready
            </span>
          </div>
          <ProgressBar value={profileSummary.completion} label="Profile completion" />
          <button className="text-link" type="button" onClick={() => onNavigate('/profile')}>
            Refine your profile <span aria-hidden="true">↗</span>
          </button>
        </Card>

        <Card
          className="dashboard-stat-card"
          title="Interests"
          description="Signals currently shaping your direction."
        >
          <strong className="dashboard-stat-card__value">{profileSummary.interests}</strong>
          <span className="dashboard-stat-card__label">saved interests</span>
        </Card>

        <Card
          className="dashboard-stat-card"
          title="Current skills"
          description="Skills available to compare against career paths."
        >
          <strong className="dashboard-stat-card__value">{profileSummary.skills}</strong>
          <span className="dashboard-stat-card__label">skills listed</span>
        </Card>
      </section>

      <section className="dashboard-progress-grid" aria-label="Learning progress summary">
        <Card
          title="Roadmap progress"
          description="Your completed roadmap steps and the skills they represent."
        >
          <div className="dashboard-progress-metric">
            <strong>{dashboard.roadmap.completionPercent}%</strong>
            <span>
              {dashboard.roadmap.completedSteps} of {dashboard.roadmap.totalSteps} steps complete
            </span>
          </div>
          <ProgressBar value={dashboard.roadmap.completionPercent} label="Roadmap completion" />
          {dashboard.roadmap.completedSkills.length > 0 ? (
            <div className="dashboard-tags" aria-label="Completed skills">
              {dashboard.roadmap.completedSkills.map((skill) => (
                <Badge key={skill} tone="success">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="muted-text">Complete a roadmap step to build your first skill signal.</p>
          )}
        </Card>

        <Card
          title="Learning streak"
          description="A simple activity signal from your roadmap updates."
        >
          <div className="dashboard-streak">
            <strong>{dashboard.streaks.currentDays}</strong>
            <span>current day streak</span>
          </div>
          <p className="muted-text">
            Longest recorded streak: {dashboard.streaks.longestDays} day
            {dashboard.streaks.longestDays === 1 ? '' : 's'}.
          </p>
        </Card>
      </section>

      <section className="dashboard-execution-grid" aria-label="Roadmap execution details">
        <Card title="Active milestones" description="Roadmap steps you have marked as in progress.">
          {dashboard.roadmap.activeMilestones.length > 0 ? (
            <div className="dashboard-list">
              {dashboard.roadmap.activeMilestones.map((milestone) => (
                <div className="dashboard-list__item" key={milestone.stepId}>
                  <div>
                    <strong>{milestone.title}</strong>
                    <small>
                      {milestone.skill} · target {formatDate(milestone.targetDate)}
                    </small>
                  </div>
                  {milestone.notes && <p>{milestone.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              No active milestones yet. Choose a roadmap step when you are ready.
            </p>
          )}
          <button
            className="text-link"
            type="button"
            onClick={() => onNavigate('/recommendations')}
          >
            Review career roadmaps <span aria-hidden="true">↗</span>
          </button>
        </Card>

        <Card
          title="Reflection notes"
          description="Your latest private notes attached to roadmap steps."
        >
          {dashboard.roadmap.reflectionNotes.length > 0 ? (
            <div className="dashboard-list">
              {dashboard.roadmap.reflectionNotes.map((note) => (
                <div className="dashboard-list__item" key={note.stepId}>
                  <strong>{note.title}</strong>
                  <small>
                    {note.skill} · updated {formatDate(note.updatedAt)}
                  </small>
                  <p>{note.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              Add a short note to a roadmap step to see reflections here.
            </p>
          )}
        </Card>
      </section>

      <Card
        className="dashboard-recommendation-change"
        title="Recommendation changes"
        description="A comparison of your two most recent completed assessment results, when available."
      >
        {latest ? (
          <div className="dashboard-recommendation-change__content">
            <div>
              <strong>{latest.topCareerIds.length} current career signals</strong>
              <small>
                Latest assessment completed {new Date(latest.completedAt).toLocaleDateString()}
              </small>
            </div>
            {previous ? (
              <div>
                <strong>
                  {dashboard.recommendationChanges.changedCareerIds.length} changed career signal
                  {dashboard.recommendationChanges.changedCareerIds.length === 1 ? '' : 's'}
                </strong>
                <small>Compared with the previous completed assessment</small>
              </div>
            ) : (
              <p className="muted-text">
                Complete another assessment later to compare changes over time.
              </p>
            )}
          </div>
        ) : (
          <p className="muted-text">
            Complete the assessment to start tracking recommendation changes.
          </p>
        )}
        <button className="text-link" type="button" onClick={() => onNavigate('/recommendations')}>
          View Job Insights <span aria-hidden="true">↗</span>
        </button>
      </Card>

      <section className="dashboard-next" aria-labelledby="dashboard-next-title">
        <div className="section-heading">
          <p className="section-kicker">Your next signals</p>
          <h2 id="dashboard-next-title">Choose where to go next.</h2>
        </div>
        <div className="dashboard-action-grid">
          <Card
            className="dashboard-action-card dashboard-action-card--dark"
            title="Discover your direction"
            description="Complete the focused assessment and surface the patterns behind what energizes you."
          >
            <button
              className="outline-button outline-button--light"
              type="button"
              onClick={() => onNavigate('/assessment')}
            >
              Start assessment <span aria-hidden="true">↗</span>
            </button>
          </Card>
          <Card
            className="dashboard-action-card"
            title="Explore career paths"
            description="Browse the broader catalog, compare roles, and see which paths fit your next chapter."
          >
            <button className="outline-button" type="button" onClick={() => onNavigate('/careers')}>
              Browse careers <span aria-hidden="true">↗</span>
            </button>
          </Card>
          <Card
            className="dashboard-action-card dashboard-action-card--warm"
            title="Review your guidance"
            description="See ranked Job Insights and turn the strongest match into a skill-gap and roadmap plan."
          >
            <button
              className="outline-button"
              type="button"
              onClick={() => onNavigate('/recommendations')}
            >
              View Job Insights <span aria-hidden="true">↗</span>
            </button>
          </Card>
        </div>
      </section>

      <aside className="dashboard-note" aria-label="Guidance note">
        <span className="dashboard-note__mark" aria-hidden="true">
          i
        </span>
        <p>
          Pathfinder offers guidance, not a guaranteed outcome. Your interests can change as you
          explore, learn, and try new things.
        </p>
      </aside>
    </div>
  );
}
