import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
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
import { getResumePreviewUrl, setResumePreview } from '../services/resume-preview';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const RESULT_STORAGE_KEY = 'pathfinder.resume-analysis.result';
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

function ResultList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) return <p className="resume-result__empty">{emptyLabel}</p>;
  return (
    <ul className="resume-result__list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function HistoryCard({ item, onView }: { item: ResumeAnalysisHistoryItem; onView: () => void }) {
  return (
    <article className="resume-history__card">
      <div className="resume-history__card-main">
        <div className="resume-history__file-row">
          <strong>{item.fileName}</strong>
          <Badge tone="success">Completed</Badge>
        </div>
        <p className="resume-history__target">
          {item.companyName} <span aria-hidden="true">•</span> {item.jobRole}
        </p>
        <p className="resume-history__date">Analyzed {formatDate(item.analyzedAt)}</p>
      </div>
      <div className="resume-history__card-action">
        <div>
          <span className="resume-history__score-label">Match score</span>
          <strong className="resume-history__score">{item.overallScore}%</strong>
        </div>
        <Button variant="outline" type="button" onClick={onView}>
          View analysis
        </Button>
      </div>
    </article>
  );
}

export function ResumeHistoryPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [items, setItems] = useState<ResumeAnalysisHistoryItem[]>([]);
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

  return (
    <section className="page-frame resume-history-page resume-theme-page">
      <div className="resume-theme-hero resume-history__hero">
        <div className="resume-theme-hero__copy">
          <p className="eyebrow">Application readiness</p>
          <h1>Resume Analyzer</h1>
          <p className="page-lead">
            Track your resume analysis and compare every application with more clarity.
          </p>
          <Button
            variant="primary"
            type="button"
            onClick={() => onNavigate('/resume-analyzer/upload')}
          >
            Upload Resume <span aria-hidden="true">↗</span>
          </Button>
        </div>
        <div className="resume-theme-hero__art" aria-hidden="true">
          <img src="/assets/resume-analyzer-botanical-hero.png" alt="" />
        </div>
      </div>

      <div className="resume-history__heading">
        <div>
          <p className="section-kicker">Your application workspace</p>
          <h2>Keep your strongest version close.</h2>
        </div>
        <p>Review previous reports, then use the evidence to prepare your next application.</p>
      </div>

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
      ) : (
        <div className="resume-history__list" aria-label="Resume analysis history">
          {items.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onView={() => onNavigate(`/resume-analyzer/results/${encodeURIComponent(item.id)}`)}
            />
          ))}
        </div>
      )}

      <div className="resume-theme-footer" aria-hidden="true">
        <span />
        <span />
      </div>
    </section>
  );
}

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const normalizedScore = score === null ? 0 : Math.min(100, Math.max(0, score));
  const style = { '--score': `${normalizedScore}%` } as CSSProperties;

  return (
    <div className="resume-results__score-ring-card">
      <div className="resume-results__score-ring" style={style}>
        <span>{score === null ? '—' : score}</span>
        <small>/100</small>
      </div>
      <strong>{label}</strong>
      <small>{score === null ? 'Detailed score unavailable' : 'Evidence-based score'}</small>
    </div>
  );
}

function EvidenceItems({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="resume-results__empty-detail">{emptyLabel}</p>;
  }
  return (
    <div className="resume-results__evidence-grid">
      {items.map((item, index) => (
        <article className="resume-results__evidence-card" key={`${item}-${index}`}>
          <span aria-hidden="true">{index % 2 === 0 ? '✓' : '•'}</span>
          <p>{item}</p>
        </article>
      ))}
    </div>
  );
}

function CategoryDetailCard({
  label,
  score,
  tips,
}: {
  label: string;
  score: number | null;
  tips: string[];
}) {
  return (
    <article className="resume-results__category-card">
      <header>
        <strong>{label}</strong>
        <span>{score === null ? '—' : `${score}/100`}</span>
      </header>
      <EvidenceItems
        items={tips}
        emptyLabel="No detailed evidence was returned for this category."
      />
    </article>
  );
}

function ResumePreview({ fileName }: { fileName: string }) {
  const previewUrl = getResumePreviewUrl();

  return (
    <aside className="resume-results__preview" aria-label="Uploaded resume preview">
      <div className="resume-results__preview-heading">
        <span>Resume preview</span>
        <small>{fileName}</small>
      </div>
      {previewUrl ? (
        <img
          className="resume-results__preview-image"
          src={previewUrl}
          alt={`${fileName} first-page preview`}
        />
      ) : (
        <div className="resume-results__preview-fallback">
          <div className="resume-results__preview-paper" aria-hidden="true">
            <strong>RESUME</strong>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>{fileName}</strong>
          <p>
            Resume image preview is available when you open a report immediately after uploading it.
          </p>
        </div>
      )}
    </aside>
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

  const { analysis } = result;
  const preferredOutputs = analysis.preferredOutputs ?? DEFAULT_PREFERRED_OUTPUTS;
  const roleFit = analysis.roleFit ?? analysis.summary;
  const atsKeywords = analysis.atsKeywords ?? analysis.matchingSkills;
  const priorityActions = analysis.priorityActions ?? analysis.recommendations;
  const interviewTopics = analysis.interviewTopics ?? [];
  const learningPlan = analysis.learningPlan ?? analysis.recommendations;
  const categoryBreakdown = analysis.categoryBreakdown ?? {
    ats: { score: null, tips: atsKeywords },
    toneAndStyle: { score: null, tips: analysis.improvements },
    content: { score: null, tips: analysis.strengths },
    structure: { score: null, tips: analysis.recommendations },
    skills: { score: null, tips: analysis.missingSkills },
  };
  const shows = (focus: ResumeOutputFocus) => preferredOutputs.includes(focus);
  return (
    <section className="page-frame resume-results-page resume-theme-page">
      <div className="resume-results__toolbar">
        <Button variant="outline" type="button" onClick={() => onNavigate('/')}>
          ← Back to Homepage
        </Button>
        <Button variant="outline" type="button" onClick={() => window.print()}>
          Download PDF Report
        </Button>
      </div>

      <div className="resume-results__workspace">
        <ResumePreview fileName={result.fileName} />
        <div className="resume-results__report">
          <header className="resume-results__report-header">
            <div>
              <p className="eyebrow">Resume Review</p>
              <h1>Resume Review</h1>
              <p className="page-lead">
                {result.fileName} · Analyzed {formatDate(result.analyzedAt)}
              </p>
            </div>
            <Badge tone="success">{analysis.overallScore}% alignment</Badge>
          </header>

          <section className="resume-results__report-meta" aria-label="Report metadata">
            <div className="resume-results__brand">
              <span aria-hidden="true">pf</span>
              <strong>Pathfinder</strong>
            </div>
            <div className="resume-results__report-meta-label">
              <span>Resume Analysis Report</span>
              <small>{formatDate(result.analyzedAt)}</small>
            </div>
            <div className="resume-results__report-meta-targets">
              <span>
                Target role: <strong>{result.jobRole}</strong>
              </span>
              <span>
                Target company: <strong>{result.companyName}</strong>
              </span>
            </div>
          </section>

          <Card
            className="resume-result__summary"
            title="Analysis Summary"
            description="A concise, evidence-based readout of the strongest signal, main gap, and next move."
          >
            <div className="resume-results__score-rings">
              <ScoreRing score={analysis.overallScore} label="Overall resume score" />
              <ScoreRing score={categoryBreakdown.ats.score} label="ATS compatibility score" />
            </div>
            <div className="resume-results__score-breakdown">
              <span className="resume-results__subheading">Score breakdown</span>
              <div className="resume-results__score-breakdown-grid">
                {[
                  ['Tone & Style', categoryBreakdown.toneAndStyle.score],
                  ['Content', categoryBreakdown.content.score],
                  ['Structure', categoryBreakdown.structure.score],
                  ['Skills', categoryBreakdown.skills.score],
                ].map(([label, score]) => {
                  const numericScore = typeof score === 'number' ? score : 0;
                  return (
                    <div className="resume-results__score-bar" key={label as string}>
                      <div>
                        <strong>{label}</strong>
                        <span>{typeof score === 'number' ? `${score}/100` : 'Not scored'}</span>
                      </div>
                      <div className="resume-results__score-bar-track">
                        <span style={{ width: `${numericScore}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="resume-result__summary-copy">
              <span>Executive assessment</span>
              <p>{analysis.summary}</p>
            </div>
          </Card>

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
              <ResultList
                items={analysis.matchingSkills}
                emptyLabel="No direct matches were identified in the supplied evidence."
              />
            </Card>
            <Card
              title="Skills to strengthen"
              description="Relevant requirements that are not clearly evidenced in the resume."
            >
              <ResultList
                items={analysis.missingSkills}
                emptyLabel="No major missing skills were identified."
              />
            </Card>
          </div>

          {shows('ats_keywords') && (
            <Card
              title="ATS Compatibility Analysis"
              description="Applicant Tracking System screening evaluates file formatting, structural clarity, keyword density, and parseability."
            >
              <div className="resume-results__detail-score-row">
                <span>ATS compatibility score</span>
                <strong>
                  {categoryBreakdown.ats.score === null
                    ? 'Not scored'
                    : `${categoryBreakdown.ats.score}/100`}
                </strong>
              </div>
              <EvidenceItems
                items={
                  categoryBreakdown.ats.tips.length > 0 ? categoryBreakdown.ats.tips : atsKeywords
                }
                emptyLabel="No additional ATS findings were returned."
              />
            </Card>
          )}

          <Card
            className="resume-results__recommendations"
            title="Recommended Action Items"
            description="Prioritized next steps for this application."
          >
            <EvidenceItems
              items={priorityActions.length > 0 ? priorityActions : analysis.recommendations}
              emptyLabel="No recommendations were returned by the analysis."
            />
          </Card>

          <section className="resume-results__category-breakdown">
            <header className="resume-results__section-heading">
              <p className="eyebrow">Deep-dive analysis</p>
              <h2>Category Detailed Breakdown</h2>
            </header>
            <div className="resume-results__category-grid">
              <CategoryDetailCard
                label="Tone & Style"
                score={categoryBreakdown.toneAndStyle.score}
                tips={
                  categoryBreakdown.toneAndStyle.tips.length > 0
                    ? categoryBreakdown.toneAndStyle.tips
                    : analysis.improvements
                }
              />
              <CategoryDetailCard
                label="Content"
                score={categoryBreakdown.content.score}
                tips={
                  categoryBreakdown.content.tips.length > 0
                    ? categoryBreakdown.content.tips
                    : analysis.strengths
                }
              />
              <CategoryDetailCard
                label="Structure"
                score={categoryBreakdown.structure.score}
                tips={
                  categoryBreakdown.structure.tips.length > 0
                    ? categoryBreakdown.structure.tips
                    : analysis.recommendations
                }
              />
              <CategoryDetailCard
                label="Skills"
                score={categoryBreakdown.skills.score}
                tips={
                  categoryBreakdown.skills.tips.length > 0
                    ? categoryBreakdown.skills.tips
                    : analysis.missingSkills
                }
              />
            </div>

            {shows('writing_improvements') && (
              <Card
                title="Resume writing improvements"
                description="Changes that can improve clarity without inventing experience."
              >
                <EvidenceItems
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
                <EvidenceItems
                  items={interviewTopics}
                  emptyLabel="No interview topics were returned."
                />
              </Card>
            )}

            {shows('learning_plan') && (
              <Card
                title="Learning plan"
                description="A short sequence for closing relevant skill gaps."
              >
                <EvidenceItems items={learningPlan} emptyLabel="No learning plan was returned." />
              </Card>
            )}
          </section>

          <div className="resume-results__actions">
            <Button
              variant="primary"
              type="button"
              onClick={() => onNavigate('/resume-analyzer/upload')}
            >
              Analyze another resume
            </Button>
            <Button variant="ghost" type="button" onClick={() => onNavigate('/advisor')}>
              Discuss this with the AI advisor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResumeAnalyzerUploadPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
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
    }, 4_000);
    return () => window.clearInterval(stageTimer);
  }, [isAnalyzing]);

  useEffect(() => {
    setErrorMessage('');
  }, [companyName, jobRole, jobDescription, file]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== 'application/pdf' || !selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setErrorMessage('Please upload your resume as a PDF file.');
      event.target.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setErrorMessage('Your PDF must be 8 MB or smaller.');
      event.target.value = '';
      return;
    }
    setFile(selected);
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
    if (puterSignedIn !== true) {
      setErrorMessage('Click “Sign in to Puter” before analyzing your resume.');
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const result = await analyzeResumeWithPuter({
        companyName,
        jobRole,
        jobDescription,
        preferredOutputs: DEFAULT_PREFERRED_OUTPUTS,
        file,
      });
      saveResult(result);
      setAnalysisStage(2);
      await setResumePreview(file);
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
    <section className="page-frame resume-analyzer-page resume-theme-page">
      <div className="resume-theme-hero resume-upload__hero">
        <div className="resume-theme-hero__copy">
          <p className="eyebrow">Build a stronger application</p>
          <h1>Upload Resume</h1>
          <p className="page-lead">
            Compare your resume with a target role and turn the evidence into practical career
            guidance.
          </p>
          <div className="resume-upload__hero-meta">
            <Badge tone="neutral">PDF · up to 8 MB</Badge>
            <span>Private, evidence-based review</span>
          </div>
        </div>
        <div className="resume-theme-hero__art" aria-hidden="true">
          <img src="/assets/resume-analyzer-botanical-hero.png" alt="" />
        </div>
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
          className="resume-upload__form-card"
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
                <div className="resume-analysis-progress__visual" aria-hidden="true">
                  <div className="resume-analysis-progress__document">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="resume-analysis-progress__magnifier">
                    <span />
                  </div>
                  <div className="resume-analysis-progress__scan-line" />
                </div>
                <div className="resume-analysis-progress__header">
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
            <label className="form-field">
              <span>Resume PDF</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                required={!file}
              />
            </label>
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
          className="resume-analyzer__explainer resume-upload__explainer-card"
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
