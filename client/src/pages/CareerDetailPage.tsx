import { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { getCareer, getLearningResources } from '../services/careers';
import type { CareerDetail, LearningResource } from '../types/domain';

interface CareerDetailPageProps {
  careerId?: string;
  onNavigate: (href: string) => void;
}

const toSearchSlug = (role: string) =>
  role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const JOB_MARKET_PLATFORMS: Array<{
  label: string;
  description: string;
  buildUrl: (role: string) => string;
}> = [
  {
    label: 'Naukri',
    description: 'India jobs',
    buildUrl: (role) => `https://www.naukri.com/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'Indeed',
    description: 'Global job search',
    buildUrl: (role) => `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}`,
  },
  {
    label: 'Apna',
    description: 'Jobs across India',
    buildUrl: (role) => `https://apna.co/jobs/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'Foundit',
    description: 'Jobs and vacancies',
    buildUrl: (role) => `https://www.foundit.in/search/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'LinkedIn Jobs',
    description: 'Jobs and networking',
    buildUrl: (role) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`,
  },
  {
    label: 'Instahyre',
    description: 'Tech and startup jobs',
    buildUrl: (role) => `https://www.instahyre.com/${toSearchSlug(role)}-jobs/`,
  },
  {
    label: 'Wellfound',
    description: 'Startup jobs',
    buildUrl: (role) => `https://wellfound.com/jobs?query=${encodeURIComponent(role)}`,
  },
];

const CAREER_DETAIL_ENRICHMENTS: Record<
  string,
  {
    additionalSkills: string[];
    jobSearches: Array<{
      role: string;
      links: Array<{ label: string; url: string }>;
    }>;
  }
> = {
  career_ai_engineer: {
    additionalSkills: [
      'Deep Learning',
      'Natural Language Processing',
      'Generative AI',
      'MLOps',
      'Cloud Deployment',
      'Model Evaluation',
    ],
    jobSearches: [
      {
        role: 'AI Engineer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/ai-engineer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-ai-engineer-jobs.html' },
        ],
      },
      {
        role: 'Machine Learning Engineer',
        links: [
          {
            label: 'Naukri',
            url: 'https://www.naukri.com/machine-learning-engineer-jobs',
          },
          {
            label: 'Indeed',
            url: 'https://www.indeed.com/q-machine-learning-engineer-jobs.html',
          },
        ],
      },
      {
        role: 'AI Developer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/ai-developer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-ai-developer-jobs.html' },
        ],
      },
      {
        role: 'MLOps Engineer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/mlops-engineer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-mlops-engineer-jobs.html' },
        ],
      },
    ],
  },
  career_cybersecurity_analyst: {
    additionalSkills: [
      'Threat Modeling',
      'Incident Response',
      'SIEM',
      'Network Security',
      'Penetration Testing',
      'Identity and Access Management',
    ],
    jobSearches: [
      {
        role: 'Cybersecurity Analyst',
        links: [
          {
            label: 'Naukri',
            url: 'https://www.naukri.com/cyber-security-analyst-jobs',
          },
          {
            label: 'Indeed',
            url: 'https://www.indeed.com/q-cybersecurity-analyst-jobs.html',
          },
        ],
      },
      {
        role: 'Security Engineer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/security-engineer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-security-engineer-jobs.html' },
        ],
      },
      {
        role: 'Penetration Tester',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/penetration-testing-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-penetration-tester-jobs.html' },
        ],
      },
      {
        role: 'SOC Analyst',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/soc-analyst-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-soc-analyst-jobs.html' },
        ],
      },
    ],
  },
  career_data_analyst: {
    additionalSkills: [
      'Statistics',
      'Microsoft Excel',
      'Data Visualization',
      'Power BI',
      'Tableau',
      'ETL Fundamentals',
    ],
    jobSearches: [
      {
        role: 'Data Analyst',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/data-analyst-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-data-analyst-jobs.html' },
        ],
      },
      {
        role: 'Business Intelligence Analyst',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/business-intelligence-analyst-jobs' },
          {
            label: 'Indeed',
            url: 'https://www.indeed.com/q-business-intelligence-analyst-jobs.html',
          },
        ],
      },
      {
        role: 'Data Visualization Analyst',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/data-visualization-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-data-visualization-jobs.html' },
        ],
      },
      {
        role: 'Reporting Analyst',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/reporting-analyst-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-reporting-analyst-jobs.html' },
        ],
      },
    ],
  },
  career_product_designer: {
    additionalSkills: [
      'User Research',
      'Wireframing',
      'Prototyping',
      'Design Systems',
      'Accessibility',
      'Figma',
    ],
    jobSearches: [
      {
        role: 'Product Designer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/product-designer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-product-designer-jobs.html' },
        ],
      },
      {
        role: 'UX/UI Designer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/ux-ui-designer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-ux-ui-designer-jobs.html' },
        ],
      },
      {
        role: 'Interaction Designer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/interaction-designer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-interaction-designer-jobs.html' },
        ],
      },
      {
        role: 'Design Systems Designer',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/design-system-designer-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-design-systems-designer-jobs.html' },
        ],
      },
    ],
  },
  career_ux_researcher: {
    additionalSkills: [
      'User Interviews',
      'Usability Testing',
      'Qualitative Research',
      'Survey Design',
      'Information Architecture',
      'Accessibility Research',
    ],
    jobSearches: [
      {
        role: 'UX Researcher',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/ux-researcher-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-ux-researcher-jobs.html' },
        ],
      },
      {
        role: 'User Researcher',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/user-researcher-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-user-researcher-jobs.html' },
        ],
      },
      {
        role: 'Usability Tester',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/usability-testing-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-usability-tester-jobs.html' },
        ],
      },
      {
        role: 'Product Researcher',
        links: [
          { label: 'Naukri', url: 'https://www.naukri.com/product-researcher-jobs' },
          { label: 'Indeed', url: 'https://www.indeed.com/q-product-researcher-jobs.html' },
        ],
      },
    ],
  },
};

export function CareerDetailPage({ careerId, onNavigate }: CareerDetailPageProps) {
  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [resources, setResources] = useState<LearningResource[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCareer = () => {
    if (!careerId) {
      setCareer(null);
      setErrorMessage('This career path does not have a valid identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResources(null);
    getCareer(careerId)
      .then(async (loadedCareer) => {
        setCareer(loadedCareer);
        setResources(loadedCareer.learningResources);
        try {
          const rankedResources = await getLearningResources(careerId, { limit: 20 });
          setResources(rankedResources.resources);
        } catch {
          // Keep the embedded, backward-compatible catalog if migration 016 is not deployed yet.
        }
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Career details could not be loaded. Please try again.',
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCareer();
  }, [careerId]);

  if (isLoading) {
    return (
      <div className="page-frame career-page">
        <LoadingState
          label="Loading career details"
          description="We are preparing the skills, resources, roadmap, and available environment."
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="page-frame career-page">
        <ErrorState
          title="This career path needs another look"
          description={errorMessage}
          onAction={loadCareer}
        />
        <button
          className="text-link page-back-link"
          type="button"
          onClick={() => onNavigate('/careers')}
        >
          ← Back to career paths
        </button>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="page-frame career-page">
        <EmptyState
          title="Career details are unavailable"
          description="Return to the catalog and choose a career path to explore."
          actionLabel="Browse career paths"
          onAction={() => onNavigate('/careers')}
        />
      </div>
    );
  }

  const displayedResources = resources ?? career.learningResources;
  const careerEnrichment = CAREER_DETAIL_ENRICHMENTS[career.id];
  const skillsToBuild = [
    ...new Set([...(career.skills ?? []), ...(careerEnrichment?.additionalSkills ?? [])]),
  ];

  return (
    <div className="page-frame career-page career-detail-page">
      <button
        className="text-link page-back-link"
        type="button"
        onClick={() => onNavigate('/careers')}
      >
        ← Back to career paths
      </button>

      <section className="career-detail-hero">
        <div>
          <p className="eyebrow">Career path</p>
          <h1>{career.name}</h1>
          <p className="page-lead">{career.description}</p>
        </div>
        <div className="career-detail-hero__actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('/assessment')}
          >
            Take the assessment <span aria-hidden="true">↗</span>
          </button>
          <button
            className="outline-button"
            type="button"
            onClick={() => onNavigate(`/careers/${encodeURIComponent(career.id)}/roadmap`)}
          >
            View roadmap
          </button>
        </div>
      </section>

      <section className="career-detail-grid">
        <Card title="Skills to build" description="The capabilities connected to this career path.">
          {skillsToBuild.length > 0 ? (
            <div className="career-detail__tags">
              {skillsToBuild.map((skill) => (
                <Badge key={skill} tone="info">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="muted-text">Skill details will be added as the catalog grows.</p>
          )}
        </Card>

        <Card
          title="Immersive environment"
          description="VR is an optional layer, not a requirement for a career path."
        >
          {career.environment?.available ? (
            <div className="environment-card">
              <Badge tone="success">Available now</Badge>
              <h2>{career.environment.title}</h2>
              <p>{career.environment.description}</p>
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  onNavigate(`/vr?environment=${encodeURIComponent(career.environment?.key ?? '')}`)
                }
              >
                Explore this environment <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <div className="environment-card environment-card--unavailable">
              <Badge tone="neutral">Catalog only</Badge>
              <h2>No VR environment yet</h2>
              <p>
                This career remains fully supported in the guidance system. An immersive environment
                can be added later without changing this career path or its roadmap.
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="career-detail-grid career-detail-grid--lower">
        <Card
          title="Learning resources"
          description="Curated starting points for exploring this direction."
        >
          {displayedResources.length > 0 ? (
            <div className="resource-list">
              {displayedResources.map((resource) => (
                <a
                  key={`${resource.id ?? resource.title}-${resource.url ?? 'resource'}`}
                  className="resource-item"
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    <strong>{resource.title}</strong>
                    {resource.description && <small>{resource.description}</small>}
                    <small className="resource-item__meta">
                      {resource.provider ?? 'Catalog source'}
                      {resource.sourceType === 'ai-suggestion'
                        ? ' · AI suggestion'
                        : ' · Catalog link'}
                      {resource.costModel === 'free' ? ' · Free' : ''}
                      {resource.durationMinutes ? ` · ${resource.durationMinutes} min` : ''}
                      {resource.verification === 'verified' ? ' · Verified source' : ''}
                    </small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              Learning resources will appear here as this path is expanded.
            </p>
          )}
        </Card>

        <Card
          title="Roadmap preview"
          description="A quick view of the ordered steps connected to this career."
        >
          {career.roadmap.length > 0 ? (
            <ol className="roadmap-preview">
              {career.roadmap.slice(0, 4).map((step) => (
                <li key={step.id}>
                  <span className="roadmap-preview__number">{step.displayOrder}</span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.skill}</small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted-text">A roadmap will appear here as learning steps are added.</p>
          )}
          {career.roadmap.length > 4 && (
            <button
              className="text-link"
              type="button"
              onClick={() => onNavigate(`/careers/${encodeURIComponent(career.id)}/roadmap`)}
            >
              See all roadmap steps <span aria-hidden="true">↗</span>
            </button>
          )}
        </Card>
      </section>

      {careerEnrichment && careerEnrichment.jobSearches.length > 0 && (
        <section className="career-detail-grid career-detail-grid--jobs">
          <Card
            title="Real-world job opportunities"
            description="Open live search pages to see current roles and availability for this career direction."
          >
            <div className="job-opportunity-list">
              {careerEnrichment.jobSearches.map((jobSearch) => (
                <article className="job-opportunity" key={jobSearch.role}>
                  <div className="job-opportunity__role">
                    <strong>{jobSearch.role}</strong>
                    <small>Current openings and requirements</small>
                  </div>
                  <details className="job-opportunity__chooser">
                    <summary className="job-opportunity__apply-button">
                      Apply for jobs <span aria-hidden="true">↗</span>
                    </summary>
                    <div
                      className="job-opportunity__links"
                      aria-label={`${jobSearch.role} job platforms`}
                    >
                      {JOB_MARKET_PLATFORMS.map((platform) => (
                        <a
                          className="job-opportunity__link"
                          href={platform.buildUrl(jobSearch.role)}
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
                </article>
              ))}
            </div>
            <p className="job-opportunity-note">
              Job listings, locations, and counts change frequently. Use the search filters on each
              site to refine the results.
            </p>
          </Card>
        </section>
      )}
    </div>
  );
}
