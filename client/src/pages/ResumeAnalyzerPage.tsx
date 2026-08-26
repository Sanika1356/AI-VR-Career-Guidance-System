import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import {
  analyzeResume,
  type ResumeAnalysis,
  type ResumeAnalysisResponse,
} from '../services/resume-analyzer';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const RESULT_STORAGE_KEY = 'pathfinder.resume-analysis.result';

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

export function ResumeAnalysisResultsPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const result = readResumeAnalysisResult();
  if (!result) {
    return (
      <section className="page-frame">
        <ErrorState
          title="No resume analysis found"
          description="Analyze a resume first, then return here to review the structured report."
          actionLabel="Open Resume Analyzer"
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
            A role-specific review of your resume against the job information you provided.
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
        <Button variant="primary" type="button" onClick={() => onNavigate('/resume-analyzer')}>
          Analyze another resume
        </Button>
        <Button variant="outline" type="button" onClick={() => onNavigate('/advisor')}>
          Discuss this with the AI advisor
        </Button>
      </div>
    </section>
  );
}

export function ResumeAnalyzerPage({ onNavigate }: { onNavigate: (href: string) => void }) {
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
      const result = await analyzeResume({ companyName, jobRole, jobDescription, file });
      saveResult(result);
      onNavigate('/resume-analyzer/results');
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
          <h1>Resume Analyzer</h1>
          <p className="page-lead">
            Compare your resume with a target role and turn the results into practical career
            guidance.
          </p>
        </div>
        <Badge tone="neutral">PDF · up to 8 MB</Badge>
      </div>

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
          description="A structured review generated by the same server-side AI provider architecture used by Pathfinder’s advisor."
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
            Do not upload confidential information that you are not authorized to share. The
            analysis is educational guidance, not a hiring decision.
          </p>
        </Card>
      </div>
    </section>
  );
}
