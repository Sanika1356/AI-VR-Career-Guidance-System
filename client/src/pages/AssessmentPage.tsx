import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Notification } from '../components/Notification';
import { ProgressBar } from '../components/ProgressBar';
import { getAssessmentQuestions, submitAssessment } from '../services/assessment';
import type {
  AssessmentQuestion,
  AssessmentQuestionSet,
  AssessmentResultResponse,
  AssessmentSubmission,
} from '../types/domain';

interface AssessmentPageProps {
  onNavigate?: (href: string) => void;
}

type AssessmentStage = 'intro' | 'questions' | 'confirm' | 'completed';

type Answers = Record<string, string>;

type AssessmentDraft = {
  assessmentId: string;
  answers: Answers;
  stage: Exclude<AssessmentStage, 'completed'>;
  currentQuestionIndex: number;
};

const ASSESSMENT_DRAFT_KEY = 'pathfinder.assessment.draft';

function readAssessmentDraft(): AssessmentDraft | null {
  try {
    const raw = window.sessionStorage.getItem(ASSESSMENT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssessmentDraft>;
    if (
      typeof parsed.assessmentId !== 'string' ||
      !parsed.answers ||
      typeof parsed.answers !== 'object' ||
      !['intro', 'questions', 'confirm'].includes(parsed.stage ?? '') ||
      typeof parsed.currentQuestionIndex !== 'number'
    ) {
      return null;
    }
    return parsed as AssessmentDraft;
  } catch {
    return null;
  }
}

function saveAssessmentDraft(draft: AssessmentDraft): void {
  try {
    window.sessionStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private browsing or storage limits should not block assessment progress.
  }
}

function clearAssessmentDraft(): void {
  try {
    window.sessionStorage.removeItem(ASSESSMENT_DRAFT_KEY);
  } catch {
    // Ignore storage cleanup failures; the completed result remains usable in memory.
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getQuestionTypeLabel(question: AssessmentQuestion): string {
  return question.type.replace('-', ' ');
}

function AssessmentIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="assessment-page__intro-grid">
      <div className="assessment-page__intro-copy">
        <p className="eyebrow">A thoughtful starting point</p>
        <h1>
          Find the signal in <em>your story.</em>
        </h1>
        <p>
          This short assessment looks at the activities, strengths, and working styles that give
          your ambitions shape. There are no right answers—choose what feels most like you.
        </p>
        <div className="assessment-page__intro-actions">
          <Button size="large" onClick={onStart}>
            Begin assessment <span aria-hidden="true">↗</span>
          </Button>
          <span className="assessment-page__intro-note">
            Your answers stay private to your account.
          </span>
        </div>
      </div>
      <div className="assessment-page__intro-marker" aria-hidden="true">
        <span>02</span>
        <strong>
          CURIOUS
          <br />
          BY DESIGN
        </strong>
      </div>
    </section>
  );
}

function AssessmentQuestion({
  question,
  answer,
  error,
  onChange,
}: {
  question: AssessmentQuestion;
  answer?: string;
  error?: string | null;
  onChange: (optionId: string) => void;
}) {
  const errorId = `${question.id}-error`;
  const questionId = `${question.id}-prompt`;

  return (
    <fieldset className="assessment-question" aria-describedby={error ? errorId : undefined}>
      <legend id={questionId} className="assessment-question__text">
        {question.text}
      </legend>
      <div className="assessment-question__meta">
        <Badge tone="info">{getQuestionTypeLabel(question)}</Badge>
        <span>Select one response</span>
      </div>
      <div className="assessment-options" role="radiogroup" aria-labelledby={questionId}>
        {(question.options ?? []).map((option) => {
          const inputId = `${question.id}-${option.id}`;
          return (
            <label
              className={`assessment-option ${answer === option.id ? 'assessment-option--selected' : ''}`.trim()}
              htmlFor={inputId}
              key={option.id}
            >
              <input
                id={inputId}
                type="radio"
                name={question.id}
                value={option.id}
                checked={answer === option.id}
                onChange={() => onChange(option.id)}
              />
              <span className="assessment-option__indicator" aria-hidden="true" />
              <span className="assessment-option__label">{option.label}</span>
            </label>
          );
        })}
      </div>
      {question.options?.length === 0 && (
        <p className="assessment-question__empty">
          No response options are available for this question yet.
        </p>
      )}
      {error && (
        <p className="ui-field__error assessment-question__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function AssessmentConfirmation({
  questions,
  answers,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: {
  questions: AssessmentQuestion[];
  answers: Answers;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <Card
      className="assessment-page__confirm-card"
      title="Ready to see your pattern?"
      description="Review your responses once more, then submit them to generate your first Pathfinder result."
    >
      {submitError && (
        <Notification tone="error" title="We could not submit your assessment">
          {submitError}
        </Notification>
      )}
      <ol className="assessment-review-list">
        {questions.map((question, index) => {
          const selectedOption = question.options?.find(
            (option) => option.id === answers[question.id],
          );
          return (
            <li className="assessment-review-list__item" key={question.id}>
              <span className="assessment-review-list__number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong>{question.text}</strong>
                <span>{selectedOption?.label ?? 'No response selected'}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="assessment-page__actions">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Go back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Generating your result…' : 'Submit assessment'}
        </Button>
      </div>
    </Card>
  );
}

function AssessmentCompleted({
  result,
  onNavigate,
}: {
  result: AssessmentResultResponse;
  onNavigate?: (href: string) => void;
}) {
  const scores = useMemo(
    () => Object.entries(result.categoryScores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA),
    [result.categoryScores],
  );

  return (
    <section className="assessment-complete">
      <div className="assessment-complete__heading">
        <Badge tone="success">Assessment complete</Badge>
        <p className="eyebrow">A new direction is taking shape</p>
        <h1>
          Your next chapter starts with <em>curiosity.</em>
        </h1>
        <p>
          Pathfinder has translated your answers into a set of career signals. Explore your ranked
          recommendations to turn these signals into practical next steps.
        </p>
      </div>
      <div className="assessment-complete__grid">
        <Card
          title="Top career signals"
          description="These stable career IDs will connect to richer career details and recommendations next."
        >
          {result.topCareerIds.length > 0 ? (
            <ol className="assessment-career-list">
              {result.topCareerIds.map((careerId, index) => (
                <li key={careerId}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{careerId.replace(/^career_/, '').replace(/_/g, ' ')}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="assessment-complete__muted">No top career signals were returned.</p>
          )}
        </Card>
        <Card
          title="Category scores"
          description="Your result is ready for the next Pathfinder steps."
        >
          {scores.length > 0 ? (
            <dl className="assessment-score-list">
              {scores.map(([category, score]) => (
                <div key={category}>
                  <dt>{category.replace(/^career_/, '').replace(/_/g, ' ')}</dt>
                  <dd>{score}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="assessment-complete__muted">
              Detailed category scores are not available.
            </p>
          )}
        </Card>
      </div>
      <div className="assessment-page__actions assessment-complete__actions">
        <Button type="button" variant="outline" onClick={() => onNavigate?.('/profile')}>
          Refine your profile
        </Button>
        <Button type="button" onClick={() => onNavigate?.('/recommendations')}>
          Explore recommendations <span aria-hidden="true">↗</span>
        </Button>
      </div>
      <p className="assessment-complete__timestamp">
        Result {result.resultId} · completed {new Date(result.completedAt).toLocaleString()}
      </p>
    </section>
  );
}

export function AssessmentPage({ onNavigate }: AssessmentPageProps) {
  const [questionSet, setQuestionSet] = useState<AssessmentQuestionSet | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [stage, setStage] = useState<AssessmentStage>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuestions = useCallback(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    setIsDraftHydrated(false);
    getAssessmentQuestions()
      .then((response) => {
        if (!active) return;
        setQuestionSet(response);
        const draft = readAssessmentDraft();
        const questionIds = new Set(response.questions.map((question) => question.id));
        const restoredAnswers = draft
          ? Object.fromEntries(
              Object.entries(draft.answers).filter(([questionId]) => questionIds.has(questionId)),
            )
          : {};
        const canRestoreDraft = Boolean(
          draft && (draft.stage === 'intro' || Object.keys(restoredAnswers).length > 0),
        );
        if (draft && canRestoreDraft) {
          setAnswers(restoredAnswers);
          setStage(draft.stage);
          setCurrentQuestionIndex(
            Math.min(Math.max(draft.currentQuestionIndex, 0), response.questions.length - 1),
          );
        }
        setIsDraftHydrated(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(getErrorMessage(error, 'We could not load your assessment.'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => loadQuestions(), [loadQuestions]);

  useEffect(() => {
    if (!questionSet || !isDraftHydrated || stage === 'completed') return;
    saveAssessmentDraft({
      assessmentId: questionSet.assessmentId,
      answers,
      stage,
      currentQuestionIndex,
    });
  }, [answers, currentQuestionIndex, isDraftHydrated, questionSet, stage]);

  const questions = questionSet?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;

  const handleStart = () => {
    setStage('questions');
    setCurrentQuestionIndex(0);
    setQuestionError(null);
  };

  const handleAnswer = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionId }));
    setQuestionError(null);
  };

  const handleBack = () => {
    setQuestionError(null);
    if (currentQuestionIndex === 0) {
      setStage('intro');
      return;
    }
    setCurrentQuestionIndex((current) => current - 1);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!answers[currentQuestion.id]) {
      setQuestionError('Choose one response before continuing.');
      return;
    }
    setQuestionError(null);
    if (currentQuestionIndex === questions.length - 1) {
      setSubmitError(null);
      setStage('confirm');
      return;
    }
    setCurrentQuestionIndex((current) => current + 1);
  };

  const handleSubmit = async () => {
    if (!questionSet) return;
    const firstMissingIndex = questions.findIndex((question) => !answers[question.id]);
    if (firstMissingIndex >= 0) {
      setCurrentQuestionIndex(firstMissingIndex);
      setQuestionError('Choose one response before submitting.');
      setStage('questions');
      return;
    }

    const submission: AssessmentSubmission = {
      assessmentId: questionSet.assessmentId,
      answers: questions.map((question) => ({
        questionId: question.id,
        optionId: answers[question.id],
      })),
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await submitAssessment(submission);
      clearAssessmentDraft();
      setResult(response);
      setStage('completed');
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, 'We could not submit your assessment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="assessment-page page-container">
      <div className="assessment-page__topline">
        <span>02 / DISCOVERY</span>
        {!isLoading && questions.length > 0 && stage !== 'completed' && (
          <span>
            {answeredCount} of {questions.length} answered
          </span>
        )}
      </div>

      {isLoading && (
        <LoadingState
          label="Loading your assessment"
          description="Preparing a set of questions tuned to your Pathfinder journey."
        />
      )}

      {!isLoading && loadError && (
        <ErrorState
          title="We could not load your assessment"
          description={loadError}
          actionLabel="Try again"
          onAction={loadQuestions}
        />
      )}

      {!isLoading && !loadError && questions.length === 0 && (
        <EmptyState
          title="Your assessment is not ready yet"
          description="There are no published questions available right now. Please check back shortly."
          actionLabel="Return to profile"
          onAction={() => onNavigate?.('/profile')}
        />
      )}

      {!isLoading && !loadError && questions.length > 0 && stage === 'intro' && (
        <AssessmentIntro onStart={handleStart} />
      )}

      {!isLoading &&
        !loadError &&
        questions.length > 0 &&
        stage === 'questions' &&
        currentQuestion && (
          <section className="assessment-page__flow" aria-label="Career assessment">
            <div className="assessment-page__flow-header">
              <ProgressBar
                value={currentQuestionIndex + 1}
                max={questions.length}
                label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
                showValue={false}
              />
              <span className="assessment-page__question-count">
                {String(currentQuestionIndex + 1).padStart(2, '0')} /{' '}
                {String(questions.length).padStart(2, '0')}
              </span>
            </div>
            <Card className="assessment-page__question-card">
              <AssessmentQuestion
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                error={questionError}
                onChange={handleAnswer}
              />
              <div className="assessment-page__actions">
                <Button type="button" variant="ghost" onClick={handleBack}>
                  {currentQuestionIndex === 0 ? 'Back to intro' : 'Previous'}
                </Button>
                <Button type="button" onClick={handleNext}>
                  {currentQuestionIndex === questions.length - 1
                    ? 'Review answers'
                    : 'Next question'}
                  <span aria-hidden="true">↗</span>
                </Button>
              </div>
            </Card>
          </section>
        )}

      {!isLoading && !loadError && questions.length > 0 && stage === 'confirm' && (
        <AssessmentConfirmation
          questions={questions}
          answers={answers}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onBack={() => {
            setStage('questions');
            setCurrentQuestionIndex(questions.length - 1);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {!isLoading && !loadError && result && stage === 'completed' && (
        <AssessmentCompleted result={result} onNavigate={onNavigate} />
      )}
    </main>
  );
}
