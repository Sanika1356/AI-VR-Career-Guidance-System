import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import {
  getResumeAnalysis,
  listResumeAnalyses,
  type ResumeAnalysis,
  type ResumeAnalysisHistoryItem,
  type ResumeAnalysisResponse,
  type ResumeOutputFocus,
} from '../services/resume-analyzer';
import { analyzeResumeWithPuter, signInToPuter } from '../services/puter-resume-analyzer';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const RESULT_STORAGE_KEY = 'pathfinder.resume-analysis.result';
let activeResumePreviewUrl: string | null = null;

function setActiveResumePreview(file: File): void {
  if (activeResumePreviewUrl) URL.revokeObjectURL(activeResumePreviewUrl);
  activeResumePreviewUrl = URL.createObjectURL(file);
}
const DEFAULT_PREFERRED_OUTPUTS: ResumeOutputFocus[] = [
  'role_fit',
  'ats_keywords',
  'skill_gaps',
  'writing_improvements',
  'interview_prep',
  'learning_plan',
];
const ANALYSIS_STAGES = [
  {
    label: 'Preparing a temporary resume copy',
    detail: 'Your PDF is sent to Puter for this analysis and cleaned up afterward.',
  },
  {
    label: 'Reviewing evidence against the target role',
    detail: 'The AI is comparing the resume with the company, role, and job description.',
  },
  {
    label: 'Structuring your professional report',
    detail: 'The returned findings are being organized into the Pathfinder report sections.',
  },
] as const;

const OUTPUT_OPTIONS: Array<{ value: ResumeOutputFocus; label: string; description: string }> = [
  {
    value: 'role_fit',
    label: 'Role fit',
    description: 'Evidence-based fit explanation and alignment score.',
  },
  {
    value: 'ats_keywords',
    label: 'ATS keywords',
    description: 'Relevant terms to clarify or add where truthful.',
  },
  {
    value: 'skill_gaps',
    label: 'Skill gaps',
    description: 'Missing requirements and a learning sequence.',
  },
  {
    value: 'writing_improvements',
    label: 'Writing improvements',
    description: 'Specific resume clarity and impact suggestions.',
  },
  {
    value: 'interview_prep',
    label: 'Interview prep',
    description: 'Evidence-backed topics to prepare and discuss.',
  },
  {
    value: 'learning_plan',
    label: 'Learning plan',
    description: 'Prioritized next steps for the target role.',
  },
];

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isUnavailableAnalysis(analysis: ResumeAnalysis): boolean {
  if (analysis.provider === 'none') return true;
  const summary = analysis.summary.toLowerCase();
  return (
    analysis.overallScore === 0 &&
    /(provider unavailable|could not be generated|no role-specific analysis)/.test(summary)
  );
}

function saveResult(result: ResumeAnalysisResponse): void {
  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function readResumeAnalysisResult(): ResumeAnalysisResponse | null {
  try {
    const value = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    return value ? (JSON.parse(value) as ResumeAnalysisResponse) : null;
  } catch {
    return null;
  }
}

function ResultList({
  items,
  emptyLabel,
  ordered = false,
}: {
  items: string[];
  emptyLabel: string;
  ordered?: boolean;
}) {
  if (items.length === 0) return <p className="resume-result__empty">{emptyLabel}</p>;
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <ListTag className={`resume-result__list${ordered ? ' resume-result__list--ordered' : ''}`}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ListTag>
  );
}

function ResultChips({
  items,
  emptyLabel,
  tone = 'match',
}: {
  items: string[];
  emptyLabel: string;
  tone?: 'match' | 'gap';
}) {
  if (items.length === 0) return <p className="resume-result__empty">{emptyLabel}</p>;
  return (
    <div className={`resume-result__chips resume-result__chips--${tone}`}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>
          {tone === 'match' ? '✓' : '+'} {item}
        </span>
      ))}
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const boundedScore = Math.max(0, Math.min(100, score));
  const arcLength = Math.PI * 40;
  const status = boundedScore > 69 ? 'Strong' : boundedScore > 49 ? 'Fair' : 'Needs work';
  const statusClass =
    boundedScore > 69 ? 'is-strong' : boundedScore > 49 ? 'is-fair' : 'is-developing';

  return (
    <div className="resume-report__gauge">
      <div className="resume-report__gauge-visual">
        <svg viewBox="0 0 100 55" aria-hidden="true">
          <defs>
            <linearGradient id="resumeReportGauge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path className="resume-report__gauge-track" d="M10,50 A40,40 0 0,1 90,50" />
          <path
            className="resume-report__gauge-value"
            d="M10,50 A40,40 0 0,1 90,50"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength * (1 - boundedScore / 100)}
          />
        </svg>
        <strong>
          {Math.round(boundedScore)}
          <span>/100</span>
        </strong>
      </div>
      <span className="resume-report__gauge-label">{label}</span>
      <span className={`resume-report__status ${statusClass}`}>{status}</span>
    </div>
  );
}

function ResumePreview({ fileName }: { fileName: string }) {
  if (activeResumePreviewUrl) {
    return (
      <iframe
        className="resume-review__pdf"
        title={`Resume PDF preview for ${fileName}`}
        src={activeResumePreviewUrl}
      />
    );
  }

  return (
    <div className="resume-review__preview-empty">
      <span aria-hidden="true">PDF</span>
      <strong>Preview unavailable for this saved report</strong>
      <p>Re-upload the resume to view its document preview during the current session.</p>
    </div>
  );
}

function HistoryCard({ item, onView }: { item: ResumeAnalysisHistoryItem; onView: () => void }) {
  return (
    <article className="resume-history__card">
      <div className="resume-history__card-main">
        <div className="resume-history__file-row">
          <strong>{item.fileName}</strong>
          <Badge tone={item.overallScore === 0 ? 'warning' : 'success'}>
            {item.overallScore === 0 ? 'Needs re-analysis' : 'Completed'}
          </Badge>
        </div>
        <p className="resume-history__target">
          {item.companyName} <span aria-hidden="true">•</span> {item.jobRole}
        </p>
        <p className="resume-history__date">Analyzed {formatDate(item.analyzedAt)}</p>
      </div>
      <div className="resume-history__card-action">
        <div
          className="resume-history__gauge"
          style={{
            background: `conic-gradient(#829d31 ${Math.max(0, Math.min(100, item.overallScore)) * 3.6}deg, #e1e5dd 0deg)`,
          }}
          aria-label={`${item.overallScore} out of 100 match score`}
        >
          <div>
            <strong>{item.overallScore}</strong>
            <span>/100</span>
          </div>
        </div>
        <Button variant="outline" type="button" onClick={onView}>
          View report
        </Button>
      </div>
    </article>
  );
}

export function ResumeHistoryPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [items, setItems] = useState<ResumeAnalysisHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    listResumeAnalyses()
      .then((response) => {
        if (active) setItems(response.analyses);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Resume history is temporarily unavailable.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleItems = normalizedQuery
    ? items.filter((item) =>
        [item.fileName, item.companyName, item.jobRole].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : items;

  return (
    <section className="page-frame resume-history-page">
      <div className="resume-history__hero">
        <div className="resume-history__hero-copy">
          <p className="eyebrow">Your workspace</p>
          <h1>Make your resume work harder.</h1>
          <p>
            Understand your signal, compare it with the role you want, and turn every analysis into
            a stronger application plan.
          </p>
        </div>
        <div className="resume-history__hero-points" aria-label="Resume Analyzer benefits">
          <div>
            <span>01</span>
            <strong>See your signal</strong>
            <p>Surface strengths and gaps shaping your next opportunity.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Find your direction</strong>
            <p>Turn role-aware evidence into practical next steps.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Move with confidence</strong>
            <p>Keep your reports in Pathfinder’s user-owned history.</p>
          </div>
        </div>
      </div>

      <div className="page-frame__header resume-history__header">
        <div>
          <p className="eyebrow">Application readiness</p>
          <h2>Resume history</h2>
          <p className="page-lead">Revisit previous role comparisons and continue improving.</p>
        </div>
        <Button
          variant="primary"
          type="button"
          onClick={() => onNavigate('/resume-analyzer/upload')}
        >
          + Upload Resume
        </Button>
      </div>

      {!isLoading && !errorMessage && items.length > 0 && (
        <div className="resume-history__tools">
          <label htmlFor="resume-history-search">Search analyses</label>
          <input
            id="resume-history-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by company, role, or filename..."
          />
          <span>
            {visibleItems.length} {visibleItems.length === 1 ? 'analysis' : 'analyses'} shown
          </span>
        </div>
      )}

      {isLoading ? (
        <Card title="Loading resume history" description="Retrieving your saved analyses securely.">
          <p className="resume-history__loading">Your history will appear here in a moment.</p>
        </Card>
      ) : errorMessage ? (
        <Card
          title="History unavailable"
          description="Your saved analyses could not be loaded right now."
        >
          <p className="resume-analyzer__error" role="alert">
            {errorMessage}
          </p>
          <Button
            variant="primary"
            type="button"
            onClick={() => onNavigate('/resume-analyzer/upload')}
          >
            Upload a resume
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card
          className="resume-history__empty"
          title="No resume analyses yet"
          description="Upload your resume to compare it with a target job and receive personalized career guidance."
        >
          <Button
            variant="primary"
            type="button"
            onClick={() => onNavigate('/resume-analyzer/upload')}
          >
            + Upload Resume
          </Button>
        </Card>
      ) : visibleItems.length === 0 ? (
        <Card
          className="resume-history__empty"
          title="No matching analyses"
          description="Try a different company, role, or filename search."
        >
          <Button variant="outline" type="button" onClick={() => setSearchQuery('')}>
            Clear search
          </Button>
        </Card>
      ) : (
        <div className="resume-history__list" aria-label="Resume analysis history">
          {visibleItems.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onView={() => onNavigate(`/resume-analyzer/results/${encodeURIComponent(item.id)}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ResumeAnalysisResultsPage({
  onNavigate,
  analysisId,
}: {
  onNavigate: (href: string) => void;
  analysisId?: string;
}) {
  const [result, setResult] = useState<ResumeAnalysisResponse | null>(() =>
    analysisId ? null : readResumeAnalysisResult(),
  );
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!analysisId) return;
    let active = true;
    setIsLoading(true);
    getResumeAnalysis(analysisId)
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((error: unknown) => {
        if (active)
          setErrorMessage(
            error instanceof Error ? error.message : 'The resume analysis could not be loaded.',
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [analysisId]);

  if (isLoading) {
    return (
      <section className="page-frame">
        <Card title="Loading analysis" description="Retrieving your structured resume report.">
          <p className="resume-history__loading">
            Your structured report will appear here in a moment.
          </p>
        </Card>
      </section>
    );
  }
  if (errorMessage || !result) {
    return (
      <section className="page-frame">
        <ErrorState
          title="No resume analysis found"
          description={
            errorMessage ||
            'Analyze a resume first, then return here to review the structured report.'
          }
          actionLabel="Back to Resume History"
          onAction={() => onNavigate('/resume-analyzer')}
        />
      </section>
    );
  }

  if (isUnavailableAnalysis(result.analysis)) {
    return (
      <section className="page-frame">
        <ErrorState
          title="Fresh analysis required"
          description="This saved report does not contain a completed AI analysis. Upload the resume again to generate the current Puter-powered report instead of viewing a zero-value fallback."
          actionLabel="Analyze Resume Again"
          onAction={() => onNavigate('/resume-analyzer/upload')}
        />
      </section>
    );
  }

  const { analysis } = result;
  const preferredOutputs = analysis.preferredOutputs ?? DEFAULT_PREFERRED_OUTPUTS;
  const roleFit = analysis.roleFit ?? analysis.summary;
  const atsKeywords = analysis.atsKeywords ?? analysis.matchingSkills;
  const priorityActions = analysis.priorityActions ?? analysis.recommendations;
  const interviewTopics = analysis.interviewTopics ?? [];
  const learningPlan = analysis.learningPlan ?? analysis.recommendations;
  const shows = (focus: ResumeOutputFocus) => preferredOutputs.includes(focus);
  const evidenceTotal = analysis.matchingSkills.length + analysis.missingSkills.length;
  const evidenceMatchRate = evidenceTotal
    ? Math.round((analysis.matchingSkills.length / evidenceTotal) * 100)
    : 0;
  const categoryDetails = [
    { title: 'Role fit', items: roleFit ? [roleFit] : [], enabled: shows('role_fit') },
    {
      title: 'Writing improvements',
      items: analysis.improvements,
      enabled: shows('writing_improvements'),
    },
    { title: 'Interview preparation', items: interviewTopics, enabled: shows('interview_prep') },
    { title: 'Learning plan', items: learningPlan, enabled: shows('learning_plan') },
  ].filter((group) => group.enabled);
  return (
    <section className="page-frame resume-results-page">
      <div className="page-frame__header">
        <div>
          <p className="eyebrow">Resume intelligence</p>
          <h1>Your resume analysis</h1>
          <p className="page-lead">
            A role-specific review of <strong>{result.fileName}</strong> against the job information
            you provided.
          </p>
        </div>
        <div className="resume-results__header-actions">
          <Badge tone="success">{analysis.overallScore}% alignment</Badge>
          <Button variant="outline" type="button" onClick={() => window.print()}>
            Print / Save report
          </Button>
        </div>
      </div>

      <div className="resume-review__workspace">
        <aside className="resume-review__preview" aria-label="Resume document preview">
          <div className="resume-review__preview-header">
            <p className="eyebrow">Resume document</p>
            <strong>{result.fileName}</strong>
            <span>PDF · session preview only</span>
          </div>
          <ResumePreview fileName={result.fileName} />
        </aside>

        <div className="resume-review__report">
          <header className="resume-report__header">
            <div className="resume-report__identity">
              <span className="resume-report__mark" aria-hidden="true">
                PF
              </span>
              <div>
                <p className="section-eyebrow">Pathfinder AI Resume Intelligence</p>
                <h2>Resume Analysis Report</h2>
              </div>
            </div>
            <div className="resume-report__meta">
              <Badge tone="success">Completed</Badge>
              <span>Generated {formatDate(result.analyzedAt)}</span>
            </div>
          </header>

          <section
            className="resume-report__panel resume-report__panel--summary"
            aria-labelledby="resume-report-summary"
          >
            <div className="resume-report__section-heading">
              <div>
                <p className="section-eyebrow">Executive overview</p>
                <h2 id="resume-report-summary">Analysis Summary</h2>
              </div>
              <span className="resume-report__report-id">{result.analysisId}</span>
            </div>
            <div className="resume-report__summary-hero">
              <ScoreGauge score={analysis.overallScore} label="Overall resume score" />
              <div className="resume-report__summary-copy">
                <p className="resume-report__summary-lead">{analysis.summary}</p>
                <div className="resume-report__summary-facts">
                  <div>
                    <span>Strongest evidence</span>
                    <p>{analysis.strengths[0] || 'No specific strength was returned.'}</p>
                  </div>
                  <div>
                    <span>Priority gap</span>
                    <p>{analysis.missingSkills[0] || 'No major gap was identified.'}</p>
                  </div>
                  <div>
                    <span>Recommended next step</span>
                    <p>{priorityActions[0] || 'Review the action plan below.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {shows('role_fit') && (
            <Card
              title="Role fit"
              description="Why the supplied resume evidence aligns with the target role."
            >
              <p className="resume-result__lead">{roleFit}</p>
            </Card>
          )}

          <div className="resume-result__grid resume-result__grid--two">
            <Card
              title="Matching skills"
              description="Skills and keywords supported by both the resume and target role."
            >
              <ResultChips
                items={analysis.matchingSkills}
                emptyLabel="No direct matches were identified in the supplied evidence."
              />
            </Card>
            <Card
              title="Skills to strengthen"
              description="Relevant requirements that are not clearly evidenced in the resume."
            >
              <ResultChips
                items={analysis.missingSkills}
                tone="gap"
                emptyLabel="No major missing skills were identified."
              />
            </Card>
          </div>

          {shows('ats_keywords') && (
            <Card
              title="ATS Compatibility Analysis"
              description="A focused review of role keywords and requirements that may affect screening."
            >
              <div className="resume-result__ats-metrics">
                <div>
                  <strong>{atsKeywords.length}</strong>
                  <span>keywords to review</span>
                </div>
                <div>
                  <strong>{analysis.missingSkills.length}</strong>
                  <span>requirements to verify</span>
                </div>
              </div>
              <ResultList
                items={atsKeywords}
                emptyLabel="No additional role keywords were identified."
              />
            </Card>
          )}

          <div className="resume-result__grid resume-result__grid--two">
            <Card title="Strengths" description="Evidence that supports your target application.">
              <ResultList
                items={analysis.strengths}
                emptyLabel="No strengths were returned by the analysis."
              />
            </Card>
            <Card
              title="Improvement areas"
              description="Specific changes that can make the resume clearer and more persuasive."
            >
              <ResultList
                items={analysis.improvements}
                emptyLabel="No improvement areas were returned by the analysis."
              />
            </Card>
          </div>

          {shows('writing_improvements') && (
            <Card
              title="Resume writing improvements"
              description="Changes that can improve clarity without inventing experience."
            >
              <ResultList
                items={analysis.improvements}
                emptyLabel="No writing improvements were returned."
              />
            </Card>
          )}

          {shows('interview_prep') && (
            <Card
              title="Interview preparation"
              description="Topics grounded in the evidence supplied for this application."
            >
              <ResultList items={interviewTopics} emptyLabel="No interview topics were returned." />
            </Card>
          )}

          {shows('learning_plan') && (
            <Card
              title="Learning plan"
              description="A short sequence for closing relevant skill gaps."
            >
              <ResultList items={learningPlan} emptyLabel="No learning plan was returned." />
            </Card>
          )}

          <Card
            title="Recommended action plan"
            description="Prioritized next steps for this application."
          >
            <ResultList
              ordered
              items={priorityActions.length > 0 ? priorityActions : analysis.recommendations}
              emptyLabel="No recommendations were returned by the analysis."
            />
          </Card>

          {categoryDetails.length > 0 && (
            <Card
              title="Category Detailed Breakdown"
              description="Open each category to review the evidence and next steps returned by the analysis."
            >
              <div className="resume-result__details">
                {categoryDetails.map((group) => (
                  <details key={group.title} open>
                    <summary>
                      <span>{group.title}</span>
                      <span>{group.items.length} findings</span>
                    </summary>
                    <ResultList
                      items={group.items}
                      emptyLabel={`No ${group.title.toLowerCase()} findings were returned.`}
                    />
                  </details>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="resume-results__actions">
        <Button
          variant="primary"
          type="button"
          onClick={() => onNavigate('/resume-analyzer/upload')}
        >
          Analyze another resume
        </Button>
        <Button variant="outline" type="button" onClick={() => onNavigate('/resume-analyzer')}>
          Back to Resume History
        </Button>
        <Button variant="ghost" type="button" onClick={() => onNavigate('/advisor')}>
          Discuss this with the AI advisor
        </Button>
      </div>
    </section>
  );
}

export function ResumeAnalyzerUploadPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [preferredOutputs, setPreferredOutputs] =
    useState<ResumeOutputFocus[]>(DEFAULT_PREFERRED_OUTPUTS);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [puterSignedIn, setPuterSignedIn] = useState<boolean | null>(null);
  const [isPuterSigningIn, setIsPuterSigningIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (!window.puter) {
      setPuterSignedIn(false);
      return () => {
        active = false;
      };
    }
    Promise.resolve(window.puter.auth.isSignedIn())
      .then((signedIn) => {
        if (active) setPuterSignedIn(signedIn);
      })
      .catch(() => {
        if (active) setPuterSignedIn(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handlePuterSignIn() {
    setIsPuterSigningIn(true);
    setErrorMessage('');
    try {
      const signedIn = await signInToPuter();
      setPuterSignedIn(signedIn);
      if (!signedIn) setErrorMessage('Sign in to Puter before analyzing your resume.');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Puter sign-in could not be completed. Please try again.',
      );
    } finally {
      setIsPuterSigningIn(false);
    }
  }

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisStage(0);
      return;
    }
    setAnalysisStage(0);
    const stageTimer = window.setInterval(() => {
      setAnalysisStage((current) => Math.min(current + 1, ANALYSIS_STAGES.length - 1));
    }, 8_000);
    return () => window.clearInterval(stageTimer);
  }, [isAnalyzing]);

  useEffect(() => {
    setErrorMessage('');
  }, [companyName, jobRole, jobDescription, preferredOutputs, file]);

  function applySelectedFile(selected: File | null): void {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== 'application/pdf' || !selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setErrorMessage('Please upload your resume as a PDF file.');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setErrorMessage('Your PDF must be 8 MB or smaller.');
      return;
    }
    setFile(selected);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    applySelectedFile(event.target.files?.[0] ?? null);
    if (!event.target.files?.[0]) return;
    if (
      event.target.files[0].type !== 'application/pdf' ||
      !event.target.files[0].name.toLowerCase().endsWith('.pdf') ||
      event.target.files[0].size > MAX_FILE_BYTES
    ) {
      event.target.value = '';
    }
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    applySelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyName.trim() || !jobRole.trim() || !jobDescription.trim() || !file) {
      setErrorMessage(
        'Complete the company, role, job description, and PDF resume fields before analyzing.',
      );
      return;
    }
    if (preferredOutputs.length === 0) {
      setErrorMessage('Select at least one preferred output before analyzing.');
      return;
    }
    if (puterSignedIn !== true) {
      setErrorMessage('Click “Sign in to Puter” before analyzing your resume.');
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage('');
    setActiveResumePreview(file);
    try {
      const result = await analyzeResumeWithPuter({
        companyName,
        jobRole,
        jobDescription,
        preferredOutputs,
        file,
      });
      saveResult(result);
      onNavigate(`/resume-analyzer/results/${encodeURIComponent(result.analysisId)}`);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The resume could not be analyzed. Please try again.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="page-frame resume-analyzer-page">
      <div className="page-frame__header">
        <div>
          <p className="eyebrow">New analysis</p>
          <h1>Smart feedback for your dream role.</h1>
          <p className="page-lead">
            Drop your resume for an ATS-aware score, role-specific skill match, and practical
            improvement plan.
          </p>
        </div>
        <Badge tone="neutral">PDF · up to 8 MB</Badge>
      </div>
      <button
        className="text-link resume-analyzer__back"
        type="button"
        onClick={() => onNavigate('/resume-analyzer')}
      >
        ← Back to Resume History
      </button>

      <div className="resume-analyzer__layout">
        <Card
          title="Target role"
          description="Add the role context so the analysis can distinguish relevant evidence from generic keywords."
        >
          <form className="resume-analyzer__form" onSubmit={handleSubmit} noValidate>
            <div className="resume-puter-auth" role="status">
              {puterSignedIn ? (
                <p className="resume-puter-auth__ready">Puter is connected for this analysis.</p>
              ) : (
                <>
                  <p>Sign in to Puter to use the CVsense-style resume analysis service.</p>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handlePuterSignIn}
                    disabled={isPuterSigningIn || puterSignedIn === null}
                  >
                    {isPuterSigningIn ? 'Opening Puter sign-in…' : 'Sign in to Puter'}
                  </Button>
                </>
              )}
            </div>
            {isAnalyzing && (
              <div className="resume-analysis-progress" role="status" aria-live="polite">
                <div className="resume-analysis-progress__header">
                  <span className="resume-analysis-progress__spinner" aria-hidden="true" />
                  <div>
                    <strong>Analyzing your resume</strong>
                    <p>{ANALYSIS_STAGES[analysisStage].label}</p>
                    <small>{ANALYSIS_STAGES[analysisStage].detail}</small>
                  </div>
                </div>
                <ol className="resume-analysis-progress__stages">
                  {ANALYSIS_STAGES.map((stage, index) => (
                    <li className={index === analysisStage ? 'is-current' : ''} key={stage.label}>
                      <span aria-hidden="true">{index + 1}</span>
                      {stage.label}
                    </li>
                  ))}
                </ol>
                <p className="resume-analysis-progress__note">
                  This indicator reflects the analysis workflow; the AI service may take longer at
                  any stage. Keep this page open while the report is prepared.
                </p>
              </div>
            )}
            <label className="form-field">
              <span>Company name</span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="e.g. Microsoft"
                required
              />
            </label>
            <label className="form-field">
              <span>Job role</span>
              <input
                value={jobRole}
                onChange={(event) => setJobRole(event.target.value)}
                placeholder="e.g. Data Analyst Intern"
                required
              />
            </label>
            <label className="form-field">
              <span>Job description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description here..."
                rows={9}
                required
              />
            </label>
            <fieldset className="resume-output-preferences">
              <legend>Preferred outputs</legend>
              <p className="resume-output-preferences__hint">
                Choose the sections you want the AI to prioritize. At least one is required. Resume
                content is treated as untrusted evidence, not as instructions.
              </p>
              <div className="resume-output-preferences__grid">
                {OUTPUT_OPTIONS.map((option) => (
                  <label className="resume-output-preferences__option" key={option.value}>
                    <input
                      type="checkbox"
                      checked={preferredOutputs.includes(option.value)}
                      onChange={() =>
                        setPreferredOutputs((current) =>
                          current.includes(option.value)
                            ? current.filter((value) => value !== option.value)
                            : [...current, option.value],
                        )
                      }
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-field">
              <span id="resume-file-label">Resume PDF</span>
              <div
                className="resume-file-dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  id="resume-file"
                  className="resume-file-dropzone__input"
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-labelledby="resume-file-label"
                  onChange={handleFileChange}
                  required={!file}
                />
                <span className="resume-file-dropzone__icon" aria-hidden="true">
                  ↑
                </span>
                <strong>Click to upload or drag and drop</strong>
                <small>PDF · up to 8 MB</small>
              </div>
            </div>
            {file && (
              <div className="resume-file__selected">
                <div>
                  <strong>{file.name}</strong>
                  <span>PDF · {formatFileSize(file.size)}</span>
                </div>
                <button className="text-link" type="button" onClick={removeFile}>
                  Replace
                </button>
              </div>
            )}
            {errorMessage && (
              <p className="resume-analyzer__error" role="alert">
                {errorMessage}
              </p>
            )}
            <Button variant="primary" type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing resume…' : 'Analyze Resume'}
            </Button>
          </form>
        </Card>

        <Card
          className="resume-analyzer__explainer"
          title="What you will receive"
          description="A structured review generated through Pathfinder’s separate Puter-assisted Resume Analyzer flow."
        >
          <ol className="resume-analyzer__steps">
            <li>
              <strong>Text extraction.</strong> Your PDF is processed for this request and is not
              permanently stored by the analyzer MVP.
            </li>
            <li>
              <strong>Role comparison.</strong> Resume evidence is compared with the company, job
              role, and description you provide.
            </li>
            <li>
              <strong>Action plan.</strong> You receive matching skills, gaps, strengths,
              improvements, and prioritized recommendations.
            </li>
          </ol>
          <p className="resume-analyzer__notice">
            You may be asked to sign in to Puter for this separate analysis service. Do not upload
            confidential information that you are not authorized to share. The analysis is
            educational guidance, not a hiring decision.
          </p>
        </Card>
      </div>
    </section>
  );
}
