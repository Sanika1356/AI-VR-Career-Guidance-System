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
  deleteResumeAnalysis,
  getResumeAnalysis,
  listResumeAnalyses,
  type ResumeAnalysis,
  type ResumeAnalysisHistoryItem,
  type ResumeAnalysisResponse,
  type ResumeFinding,
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

function HistoryCard({
  item,
  onView,
  onDelete,
  isDeleting,
  deleteError,
}: {
  item: ResumeAnalysisHistoryItem;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteError?: string;
}) {
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
        <div className="resume-history__card-buttons">
          <button
            className="resume-history__delete"
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete analysis for ${item.fileName}`}
            title="Delete analysis"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2m-9 0 1 13h8l1-13" />
            </svg>
          </button>
          <Button variant="outline" type="button" onClick={onView} disabled={isDeleting}>
            View analysis
          </Button>
          {deleteError && (
            <p className="resume-history__delete-error" role="alert">
              {deleteError}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ResumeHistoryPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [items, setItems] = useState<ResumeAnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string>();
  const [deleteError, setDeleteError] = useState<{ id: string; message: string }>();

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

  async function handleDelete(item: ResumeAnalysisHistoryItem): Promise<void> {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Delete the saved analysis for ${item.fileName}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteError(undefined);
    setDeletingId(item.id);
    try {
      await deleteResumeAnalysis(item.id);
      setItems((current) => current.filter((analysis) => analysis.id !== item.id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      setDeleteError({
        id: item.id,
        message: message.includes('Route DELETE')
          ? 'Delete is unavailable until the latest backend deployment is live.'
          : message || 'This resume analysis could not be deleted. Please try again.',
      });
    } finally {
      setDeletingId(undefined);
    }
  }

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
              onDelete={() => void handleDelete(item)}
              isDeleting={deletingId === item.id}
              deleteError={deleteError?.id === item.id ? deleteError.message : undefined}
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

function ScoreRing({
  score,
  label,
  tone = 'overall',
}: {
  score: number | null;
  label: string;
  tone?: 'overall' | 'ats';
}) {
  const normalizedScore = score === null ? 0 : Math.min(100, Math.max(0, score));
  const style = { '--score': `${normalizedScore}%` } as CSSProperties;
  const status = score === null ? 'Not scored' : score < 50 ? 'Developing' : 'Strong signal';

  return (
    <div className="resume-results__score-ring-card">
      <div
        className={`resume-results__score-ring resume-results__score-ring--${tone}`}
        style={style}
      >
        <span>{score === null ? '—' : score}</span>
        <small>/100</small>
      </div>
      <strong>{label}</strong>
      <small>{status}</small>
    </div>
  );
}

function toFinding(item: string | ResumeFinding, index: number): ResumeFinding {
  return typeof item === 'string' ? { title: `Finding ${index + 1}`, detail: item } : item;
}

function uniqueFindings(...lists: Array<Array<string | ResumeFinding>>): ResumeFinding[] {
  const seen = new Set<string>();
  return lists
    .flatMap((items) => items)
    .reduce<ResumeFinding[]>((result, item, index) => {
      const finding = toFinding(item, index);
      const key = `${finding.title}:${finding.detail}`;
      if (finding.detail && !seen.has(key)) {
        seen.add(key);
        result.push(finding);
      }
      return result;
    }, []);
}

function EvidenceItems({
  items,
  emptyLabel,
}: {
  items: Array<string | ResumeFinding>;
  emptyLabel: string;
}) {
  const findings = items.map(toFinding);
  if (findings.length === 0) {
    return <p className="resume-results__empty-detail">{emptyLabel}</p>;
  }
  return (
    <div className="resume-results__evidence-grid">
      {findings.map((finding, index) => (
        <article
          className="resume-results__evidence-card"
          key={`${finding.title}-${finding.detail}-${index}`}
        >
          <span aria-hidden="true">{index % 2 === 0 ? '✓' : '•'}</span>
          <div>
            <strong>{finding.title}</strong>
            <p>{finding.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function AnalysisProgress({ analysisStage }: { analysisStage: number }) {
  return (
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
        This indicator reflects the analysis workflow; the AI service may take longer at any stage.
        Keep this page open while the report is prepared.
      </p>
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
  tips: Array<string | ResumeFinding>;
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
  const atsKeywords = analysis.atsKeywords ?? analysis.matchingSkills;
  const priorityActions = analysis.priorityActions ?? analysis.recommendations;
  const savedCategoryBreakdown = analysis.categoryBreakdown;
  const categoryBreakdown = {
    ats: {
      score: savedCategoryBreakdown?.ats?.score ?? null,
      tips: uniqueFindings(savedCategoryBreakdown?.ats?.tips ?? [], atsKeywords),
    },
    toneAndStyle: {
      score: savedCategoryBreakdown?.toneAndStyle?.score ?? null,
      tips: uniqueFindings(savedCategoryBreakdown?.toneAndStyle?.tips ?? [], analysis.improvements),
    },
    content: {
      score: savedCategoryBreakdown?.content?.score ?? null,
      tips: uniqueFindings(
        savedCategoryBreakdown?.content?.tips ?? [],
        analysis.strengths,
        analysis.improvements,
      ),
    },
    structure: {
      score: savedCategoryBreakdown?.structure?.score ?? null,
      tips: uniqueFindings(
        savedCategoryBreakdown?.structure?.tips ?? [],
        analysis.recommendations,
        analysis.improvements,
      ),
    },
    skills: {
      score: savedCategoryBreakdown?.skills?.score ?? null,
      tips: uniqueFindings(
        savedCategoryBreakdown?.skills?.tips ?? [],
        analysis.missingSkills,
        analysis.matchingSkills,
      ),
    },
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
                  categoryBreakdown.ats.tips.length > 0
                    ? uniqueFindings(categoryBreakdown.ats.tips, atsKeywords)
                    : atsKeywords
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
              items={uniqueFindings(priorityActions, analysis.recommendations)}
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
                    ? uniqueFindings(categoryBreakdown.toneAndStyle.tips, analysis.improvements)
                    : analysis.improvements
                }
              />
              <CategoryDetailCard
                label="Content"
                score={categoryBreakdown.content.score}
                tips={
                  categoryBreakdown.content.tips.length > 0
                    ? uniqueFindings(categoryBreakdown.content.tips, analysis.strengths)
                    : analysis.strengths
                }
              />
              <CategoryDetailCard
                label="Structure"
                score={categoryBreakdown.structure.score}
                tips={
                  categoryBreakdown.structure.tips.length > 0
                    ? uniqueFindings(categoryBreakdown.structure.tips, analysis.recommendations)
                    : analysis.recommendations
                }
              />
              <CategoryDetailCard
                label="Skills"
                score={categoryBreakdown.skills.score}
                tips={
                  categoryBreakdown.skills.tips.length > 0
                    ? uniqueFindings(
                        categoryBreakdown.skills.tips,
                        analysis.missingSkills,
                        analysis.matchingSkills,
                      )
                    : uniqueFindings(analysis.missingSkills, analysis.matchingSkills)
                }
              />
            </div>
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

  if (isAnalyzing) {
    return (
      <main className="resume-analysis-fullscreen">
        <div className="resume-analysis-fullscreen__inner">
          <p className="eyebrow">Pathfinder resume intelligence</p>
          <h1>We’re reviewing your resume</h1>
          <p className="resume-analysis-fullscreen__lead">
            We’re comparing your experience with the target role and turning the evidence into a
            practical report.
          </p>
          <AnalysisProgress analysisStage={analysisStage} />
        </div>
      </main>
    );
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
            <div className="resume-upload__context-grid">
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
            </div>
            <label className="form-field resume-upload__description-field">
              <span>Job description</span>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description here..."
                rows={9}
                required
              />
            </label>
            <label className="form-field resume-upload__file-field">
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
