import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import { getProfile } from '../services/profile';
import type { ProfileResponse } from '../types/domain';

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

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profileResponse = await getProfile();
      setProfile(profileResponse);
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

  if (error || !profile || !profileSummary) {
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
