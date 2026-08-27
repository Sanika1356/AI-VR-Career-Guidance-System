import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface SkillDimension {
  label: string;
  target: number;
  aliases: string[];
}

interface SkillSignal extends SkillDimension {
  current: number;
  gap: number;
}

const DEFAULT_SKILL_DIMENSIONS: SkillDimension[] = [
  { label: 'Problem solving', target: 9, aliases: ['problem solving', 'problem-solving'] },
  { label: 'Technical tools', target: 9, aliases: ['tools', 'technical', 'technology'] },
  { label: 'Analysis', target: 9, aliases: ['analysis', 'analytical'] },
  { label: 'Domain knowledge', target: 8, aliases: ['domain', 'knowledge'] },
  { label: 'Communication', target: 8, aliases: ['communication', 'communicating'] },
  { label: 'Adaptability', target: 8, aliases: ['adaptability', 'learning'] },
];

const ROLE_SKILL_DIMENSIONS: Record<string, SkillDimension[]> = {
  'AI Engineer': [
    { label: 'Coding', target: 10, aliases: ['coding', 'programming', 'python'] },
    { label: 'Math and stats', target: 8, aliases: ['math', 'statistics', 'stats'] },
    { label: 'ML frameworks', target: 9, aliases: ['ml', 'machine learning', 'frameworks'] },
    { label: 'Data engineering', target: 8, aliases: ['data', 'data engineering'] },
    { label: 'Deployment', target: 8, aliases: ['deployment', 'devops', 'cloud'] },
    { label: 'Communication', target: 7, aliases: ['communication'] },
  ],
  'Cybersecurity Analyst': [
    { label: 'Threat analysis', target: 9, aliases: ['threat', 'analysis', 'security analysis'] },
    { label: 'Networking', target: 9, aliases: ['network', 'networking'] },
    { label: 'Security tools', target: 9, aliases: ['security', 'tools', 'siem'] },
    { label: 'Incident response', target: 8, aliases: ['incident', 'response'] },
    { label: 'Risk thinking', target: 8, aliases: ['risk', 'compliance'] },
    { label: 'Communication', target: 7, aliases: ['communication'] },
  ],
  'Data Analyst': [
    { label: 'SQL', target: 9, aliases: ['sql', 'database'] },
    { label: 'Data analysis', target: 10, aliases: ['data analysis', 'analysis', 'analytical'] },
    { label: 'Python', target: 8, aliases: ['python', 'coding', 'programming'] },
    { label: 'Math and stats', target: 9, aliases: ['math', 'statistics', 'stats'] },
    { label: 'Visualization', target: 8, aliases: ['visualization', 'visualisation', 'dashboard'] },
    { label: 'Communication', target: 7, aliases: ['communication'] },
  ],
  'Product Designer': [
    { label: 'User research', target: 9, aliases: ['user research', 'research'] },
    { label: 'UX strategy', target: 8, aliases: ['ux', 'strategy'] },
    { label: 'Prototyping', target: 9, aliases: ['prototype', 'prototyping', 'design'] },
    { label: 'Visual design', target: 8, aliases: ['visual', 'design', 'ui'] },
    { label: 'Systems thinking', target: 8, aliases: ['systems', 'system thinking'] },
    { label: 'Communication', target: 8, aliases: ['communication'] },
  ],
  'UX Researcher': [
    { label: 'User research', target: 10, aliases: ['user research', 'research'] },
    { label: 'Interviews', target: 9, aliases: ['interview', 'interviews'] },
    { label: 'Synthesis', target: 9, aliases: ['synthesis', 'analysis'] },
    { label: 'Usability testing', target: 8, aliases: ['usability', 'testing', 'user testing'] },
    { label: 'Communication', target: 8, aliases: ['communication'] },
    { label: 'Product thinking', target: 7, aliases: ['product', 'strategy'] },
  ],
};

function normalizeSkill(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function skillMatches(skill: string, aliases: string[]) {
  const normalizedSkill = normalizeSkill(skill);
  return aliases.some((alias) => {
    const normalizedAlias = normalizeSkill(alias);
    return normalizedSkill.includes(normalizedAlias) || normalizedAlias.includes(normalizedSkill);
  });
}

function buildSkillSignals(recommendation: Recommendation): SkillSignal[] {
  const dimensions = ROLE_SKILL_DIMENSIONS[recommendation.career] ?? DEFAULT_SKILL_DIMENSIONS;
  const fallbackCurrent = Math.max(3, Math.min(8, Math.round(recommendation.score / 12)));

  return dimensions.map((dimension) => {
    const isMatched = recommendation.matchedSkills.some((skill) =>
      skillMatches(skill, dimension.aliases),
    );
    const isMissing = recommendation.missingSkills.some((skill) =>
      skillMatches(skill, dimension.aliases),
    );
    const current = isMatched ? 8 : isMissing ? 3 : fallbackCurrent;
    return { ...dimension, current, gap: Math.max(0, dimension.target - current) };
  });
}

function polarPoint(center: number, radius: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function polygonPoints(values: number[], center: number, radius: number) {
  return values
    .map((value, index) => {
      const point = polarPoint(center, (radius * value) / 10, index, values.length);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function SkillDnaChart({ role, signals }: { role: string; signals: SkillSignal[] }) {
  const center = 220;
  const radius = 145;
  const chartSize = 440;
  const rings = [2, 4, 6, 8, 10];
  const currentValues = signals.map((signal) => signal.current);
  const targetValues = signals.map((signal) => signal.target);

  return (
    <Card className="skill-dna-card">
      <div className="skill-dna-card__header">
        <div>
          <p className="eyebrow">Skill DNA</p>
          <h2>{role}</h2>
          <p>Your profile vs. the target role</p>
        </div>
      </div>
      <div className="skill-dna-chart-wrap">
        <svg
          className="skill-dna-chart"
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          role="img"
          aria-label={`Skill DNA radar chart for ${role}, comparing current skills with the target role`}
        >
          {rings.map((ring) => (
            <polygon
              className="skill-dna-chart__ring"
              key={ring}
              points={polygonPoints(
                signals.map(() => ring),
                center,
                radius,
              )}
            />
          ))}
          {signals.map((signal, index) => {
            const point = polarPoint(center, radius, index, signals.length);
            const labelPoint = polarPoint(center, radius + 28, index, signals.length);
            const anchor =
              labelPoint.x < center - 10 ? 'end' : labelPoint.x > center + 10 ? 'start' : 'middle';
            return (
              <g key={signal.label}>
                <line
                  className="skill-dna-chart__axis"
                  x1={center}
                  y1={center}
                  x2={point.x}
                  y2={point.y}
                />
                <text
                  className="skill-dna-chart__label"
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={anchor}
                >
                  {signal.label}
                </text>
              </g>
            );
          })}
          <polygon
            className="skill-dna-chart__target"
            points={polygonPoints(targetValues, center, radius)}
          />
          <polygon
            className="skill-dna-chart__current"
            points={polygonPoints(currentValues, center, radius)}
          />
          {currentValues.map((value, index) => {
            const point = polarPoint(center, (radius * value) / 10, index, currentValues.length);
            return (
              <circle
                className="skill-dna-chart__current-dot"
                key={index}
                cx={point.x}
                cy={point.y}
                r="6"
              />
            );
          })}
        </svg>
      </div>
      <div className="skill-dna-legend" aria-label="Chart legend">
        <span>
          <i className="skill-dna-legend__swatch skill-dna-legend__swatch--current" /> Your skills
        </span>
        <span>
          <i className="skill-dna-legend__swatch skill-dna-legend__swatch--target" /> Target role
        </span>
      </div>
      <div className="skill-dna-gaps">
        <div className="skill-dna-gaps__header">
          <p className="eyebrow">Biggest gaps</p>
          <span>Target minus current</span>
        </div>
        <div className="skill-dna-gaps__list">
          {signals
            .filter((signal) => signal.gap > 0)
            .sort((first, second) => second.gap - first.gap)
            .slice(0, 3)
            .map((signal) => (
              <div className="skill-dna-gap" key={signal.label}>
                <strong>{signal.label}</strong>
                <span>
                  {signal.current} / 10 — {signal.gap} point{signal.gap === 1 ? '' : 's'} to build
                </span>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}

function JobMarketPanel({ role }: { role: string }) {
  return (
    <Card className="job-insights-jobs-panel">
      <p className="eyebrow">Live job search</p>
      <h2>Apply for jobs</h2>
      <p className="job-insights-jobs-panel__role">Search current {role} opportunities.</p>
      <div className="job-insights-platform-grid" aria-label={`${role} job platforms`}>
        {JOB_MARKET_PLATFORMS.map((platform) => (
          <a
            className="job-insights-platform-link"
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
      <p className="job-opportunity-note">
        Availability and filters are controlled by each job platform and may change frequently.
      </p>
    </Card>
  );
}

function CareerPathRow({
  recommendation,
  selected,
  onSelect,
}: {
  recommendation: Recommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`recommendation-card recommendation-card--path${selected ? ' is-selected' : ''}`}
    >
      <button
        className="recommendation-card__path-button"
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
      >
        {recommendation.career}
      </button>
    </Card>
  );
}

export function RecommendationsPage({ onNavigate }: RecommendationsPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
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
        setSelectedCareerId((current) =>
          response.recommendations.some((recommendation) => recommendation.careerId === current)
            ? current
            : null,
        );
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

  const selectedRecommendation = useMemo(
    () => recommendations.find((recommendation) => recommendation.careerId === selectedCareerId),
    [recommendations, selectedCareerId],
  );
  const selectedSignals = selectedRecommendation ? buildSkillSignals(selectedRecommendation) : [];

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
        <>
          <section
            className="recommendations-list recommendations-list--paths"
            aria-label="Career paths"
          >
            {recommendations.map((recommendation) => (
              <CareerPathRow
                key={recommendation.careerId}
                recommendation={recommendation}
                selected={recommendation.careerId === selectedCareerId}
                onSelect={() => setSelectedCareerId(recommendation.careerId)}
              />
            ))}
          </section>
          {selectedRecommendation && (
            <section
              className="job-insights-detail"
              aria-label={`${selectedRecommendation.career} job insights`}
            >
              <SkillDnaChart role={selectedRecommendation.career} signals={selectedSignals} />
              <JobMarketPanel role={selectedRecommendation.career} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
