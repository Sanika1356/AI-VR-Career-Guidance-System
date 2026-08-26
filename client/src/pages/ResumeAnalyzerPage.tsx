import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
} from '../services/resume-analyzer';
import { analyzeResumeWithPuter } from '../services/puter-resume-analyzer';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const RESULT_STORAGE_KEY = 'pathfinder.resume-analysis.result';

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
    <section className="page-frame resume-history-page">
      <div className="page-frame__header resume-history__header">
        <div>
          <p className="eyebrow">Application readiness</p>
          <h1>Resume Analyzer</h1>
          <p className="page-lead">Track your resume analyses and compare your applications.</p>
        </div>
        <Button
          variant="primary"
          type="button"
          onClick={() => onNavigate('/resume-analyzer/upload')}
        >
          + Upload Resume
        </Button>
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

  const { analysis } = result;
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
        <Badge tone="success">{analysis.overallScore}% alignment</Badge>
      </div>

      <Card
        className="resume-result__summary"
        title="Executive summary"
        description="This score reflects evidence-based alignment, not a hiring guarantee."
      >
        <p>{analysis.summary}</p>
        <div
          className="resume-result__score"
          aria-label={`Overall alignment score ${analysis.overallScore} out of 100`}
        >
          <span>{analysis.overallScore}</span>
          <small>/100</small>
        </div>
      </Card>

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

      <Card
        title="Recommended action plan"
        description="Prioritized next steps for this application."
      >
        <ResultList
          items={analysis.recommendations}
          emptyLabel="No recommendations were returned by the analysis."
        />
      </Card>

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
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const result = await analyzeResumeWithPuter({ companyName, jobRole, jobDescription, file });
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
          <p className="eyebrow">Application readiness</p>
          <h1>Upload Resume</h1>
          <p className="page-lead">
            Compare your resume with a target role and turn the results into practical career
            guidance.
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
