import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { getDashboard } from '../services/dashboard';
import { getProfile } from '../services/profile';
import { getRecommendations } from '../services/recommendations';
import type { DashboardResponse, ProfileResponse, RecommendationResponse } from '../types/domain';

interface DashboardPageProps {
  onNavigate: (href: string) => void;
}

function formatCareerName(value: string) {
  return value
    .replace(/^career_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTimeBudget(minutes: number | null) {
  if (!minutes) return 'Time budget not set';
  if (minutes < 60) return `${minutes} min / week`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr / week`;
}

function getLearningStyle(preferences: Record<string, unknown>) {
  const style = preferences.style;
  return typeof style === 'string' && style.trim() ? style : 'Learning style not set';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
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
      const resultId = dashboardResponse.recommendationChanges.latest?.resultId;
      let recommendationResponse: RecommendationResponse | null = null;

      if (resultId) {
        try {
          recommendationResponse = await getRecommendations(resultId);
        } catch {
          // The dashboard can still show stable assessment signals if recommendations are unavailable.
        }
      }

      setProfile(profileResponse);
      setDashboard(dashboardResponse);
      setRecommendations(recommendationResponse);
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

    return {
      focus: interests[0] || 'Choose a career interest',
      skill: currentSkills[0] || 'Add your strongest skill',
      goal: profile.profile.goals[0] || 'Explore career options',
      experience: experience || 'Experience level not set',
      workStyle: profile.profile.preferredWorkConditions[0] || 'Work style not set',
      location: profile.profile.locationPreference || 'Location preference not set',
      timeBudget: formatTimeBudget(profile.profile.weeklyTimeBudgetMinutes),
      learningStyle: getLearningStyle(learningPreferences),
    };
  }, [profile]);

  const topRecommendation = recommendations?.recommendations[0] ?? null;
  const latestAssessment = dashboard?.recommendationChanges.latest;
  const topCareerSignals = topRecommendation
    ? (recommendations?.recommendations.slice(0, 3) ?? [])
    : (latestAssessment?.topCareerIds ?? []).slice(0, 3).map((careerId) => ({
        career: formatCareerName(careerId),
        careerId,
        score: 0,
        reason: 'Explore this career signal in Job Insights.',
        matchedSkills: [],
        missingSkills: [],
        evidence: {
          assessmentScore: 0,
          matchedSkillCount: 0,
          missingSkillCount: 0,
          confidence: 'low' as const,
          tradeOffs: [],
        },
      }));

  if (isLoading) {
    return (
      <div className="page-frame page-frame--narrow">
        <LoadingState
          label="Preparing your dashboard"
          description="Connecting your profile signals to the right next step."
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
  const hasAssessment = Boolean(latestAssessment);
  const assessmentCta = hasAssessment ? 'View Job Insights' : 'Begin assessment';
  const assessmentRoute = hasAssessment ? '/recommendations' : '/assessment';

  return (
    <div className="page-frame dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Your Pathfinder dashboard</p>
          <h1>
            A clearer next step starts <em>here.</em>
          </h1>
          <p className="dashboard-hero__intro">
            Welcome back, {firstName}. Your profile and assessment work together to turn your
            interests into a practical career direction.
          </p>
          <div className="dashboard-hero__tags" aria-label="Current profile focus">
            <span>
              Focus <strong>{profileSummary.focus}</strong>
            </span>
            <span>
              Goal <strong>{profileSummary.goal}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="dashboard-primary-grid">
        <section className="dashboard-profile-layout" aria-labelledby="profile-snapshot-title">
          <Card
            className="dashboard-profile-card"
            title="Profile snapshot"
            description="The context Pathfinder uses to keep your career guidance relevant."
          >
            <div className="dashboard-snapshot-grid">
              <div className="dashboard-snapshot-item dashboard-snapshot-item--accent">
                <span>Primary direction</span>
                <strong>{profileSummary.goal}</strong>
                <small>{profileSummary.focus}</small>
              </div>
              <div className="dashboard-snapshot-item">
                <span>Current foundation</span>
                <strong>{profileSummary.skill}</strong>
                <small>{profileSummary.experience}</small>
              </div>
              <div className="dashboard-snapshot-item">
                <span>Preferred environment</span>
                <strong>{profileSummary.workStyle}</strong>
                <small>{profileSummary.location}</small>
              </div>
              <div className="dashboard-snapshot-item">
                <span>Learning setup</span>
                <strong>{profileSummary.timeBudget}</strong>
                <small>{profileSummary.learningStyle}</small>
              </div>
            </div>
            <button className="text-link" type="button" onClick={() => onNavigate('/profile')}>
              Refine your profile <span aria-hidden="true">↗</span>
            </button>
          </Card>
        </section>

        <section className="dashboard-assessment-layout" aria-labelledby="assessment-signal-title">
          <div className="dashboard-section-heading">
            <div>
              <p className="section-kicker">Assessment signal</p>
              <h2 className="dashboard-assessment-heading" id="assessment-signal-title">
                {hasAssessment ? 'Your career signal' : 'Find your direction.'}
              </h2>
            </div>
            <button className="text-link" type="button" onClick={() => onNavigate(assessmentRoute)}>
              {hasAssessment ? 'Open full insights' : 'Start assessment'}{' '}
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="dashboard-assessment-grid">
            <Card
              className={`dashboard-assessment-card ${hasAssessment ? 'dashboard-assessment-card--complete' : 'dashboard-assessment-card--empty'}`}
              title={hasAssessment ? 'Top career matches' : 'Assessment pathway'}
              description={
                hasAssessment
                  ? `Based on your latest assessment${latestAssessment ? ` · completed ${formatDate(latestAssessment.completedAt)}` : ''}.`
                  : 'Answer a few focused questions to compare your strengths, interests, and work style.'
              }
            >
              {hasAssessment ? (
                <div className="dashboard-career-list">
                  {topCareerSignals.map((recommendation, index) => (
                    <div className="dashboard-career-list__item" key={recommendation.careerId}>
                      <span className="dashboard-career-list__rank">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <strong>{recommendation.career}</strong>
                        <small>{recommendation.reason}</small>
                      </div>
                      {recommendation.score > 0 && <b>{recommendation.score}%</b>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-assessment-card__empty-copy">
                  <span className="dashboard-assessment-card__number">01</span>
                  <div>
                    <strong>Start with your story</strong>
                    <p>
                      There are no right answers. Your responses become a useful starting point, not
                      a fixed label.
                    </p>
                  </div>
                </div>
              )}
              <button
                className="outline-button"
                type="button"
                onClick={() => onNavigate(assessmentRoute)}
              >
                {assessmentCta} <span aria-hidden="true">↗</span>
              </button>
            </Card>
          </div>
        </section>
      </div>

      <section className="dashboard-actions" aria-labelledby="dashboard-actions-title">
        <div className="dashboard-section-heading">
          <div>
            <p className="section-kicker">Recommended next actions</p>
            <h2 id="dashboard-actions-title">Move from insight to momentum.</h2>
          </div>
        </div>
        <div className="dashboard-action-grid">
          <Card
            className="dashboard-action-card dashboard-action-card--dark"
            title="Compare your paths"
            description="Review the strongest career matches and see which skills connect your profile to each role."
          >
            <button
              className="outline-button outline-button--light"
              type="button"
              onClick={() => onNavigate('/recommendations')}
            >
              View Job Insights <span aria-hidden="true">↗</span>
            </button>
          </Card>
          <Card
            className="dashboard-action-card"
            title="Strengthen your profile"
            description="Add the context that helps Pathfinder recommend a more realistic next step."
          >
            <button className="outline-button" type="button" onClick={() => onNavigate('/profile')}>
              Update profile <span aria-hidden="true">↗</span>
            </button>
          </Card>
          <Card
            className="dashboard-action-card dashboard-action-card--warm"
            title="Build your direction"
            description="Turn a promising career signal into a skill gap and a practical roadmap."
          >
            <button
              className="outline-button"
              type="button"
              onClick={() => onNavigate(hasAssessment ? '/recommendations' : '/careers')}
            >
              {hasAssessment ? 'Choose a path' : 'Browse careers'} <span aria-hidden="true">↗</span>
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
