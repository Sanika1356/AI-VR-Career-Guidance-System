import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import type { ChatMessage } from '../types/domain';
import {
  chatAdvisor,
  clearAdvisorHistory,
  getAdvisorCareerId,
  submitAdvisorFeedback,
} from '../services/advisor';

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 3;

function getValidationMessage(value: string): string {
  const length = value.trim().length;
  if (length === 0) return 'Write a question before asking the advisor.';
  if (length < MIN_MESSAGE_LENGTH) return 'Your question must contain at least 3 characters.';
  if (value.length > MAX_MESSAGE_LENGTH) return 'Your question must be 2000 characters or fewer.';
  return '';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? 'Just now'
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function buildClientFallbackAnswer(message: string): string {
  return [
    `## Short answer\n\nI could not reach the advisor service for “${message}”, so here is a safe starting plan instead. Compare Data Scientist, Data Analyst, and ML Engineer by the kind of work you want to do: statistical insight and experiments, practical reporting and decision support, or production machine-learning systems.`,
    `## How to compare the paths\n\nData Analyst emphasizes SQL, data cleaning, visualization, and communicating findings. Data Scientist usually adds statistics, experimentation, and predictive modeling. ML Engineer emphasizes software engineering, model deployment, testing, and reliable systems. These are directional distinctions; actual role requirements vary by employer and should be checked against current job descriptions.`,
    `## A practical next step\n\n1. Build one small project that cleans a dataset with Python and SQL.\n2. Explain the result with a clear chart and a short written recommendation.\n3. Add one simple model only after the analysis is reproducible.\n4. Review which part you enjoyed most: explaining findings, investigating patterns, or engineering a reliable model pipeline.`,
    `## What to tell the advisor next\n\nRetry after confirming that the backend is deployed and healthy. Include your preferred work style, mathematics and statistics comfort, interest in software engineering, and whether you prefer business questions or model-building. This is general guidance, not a guarantee of an employment outcome.`,
  ].join('\n\n');
}

function renderAdvisorAnswer(answer: string) {
  const blocks = answer
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <div className="advisor-message__answer">
      {blocks.map((block, index) => {
        const heading = block.match(/^#{1,3}\s+(.+?)\n([\s\S]+)$/);
        return heading ? (
          <section key={`${heading[1]}-${index}`}>
            <h3>{heading[1]}</h3>
            <p>{heading[2]}</p>
          </section>
        ) : (
          <p key={`answer-${index}`}>{block}</p>
        );
      })}
    </div>
  );
}

function isProviderFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  return /provider|ollama|ai service/i.test(`${code} ${message}`);
}

export function AdvisorPage() {
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'advisor',
      content:
        'I can help you compare career paths, understand skill gaps, and choose a practical next step. Ask me a question to begin.',
      createdAt: new Date().toISOString(),
      sources: [],
    },
  ]);
  const [draft, setDraft] = useState('');
  const [retryMessage, setRetryMessage] = useState<string>();
  const [fallbackNotice, setFallbackNotice] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const sendingRef = useRef(false);

  const validationMessage = useMemo(() => getValidationMessage(draft), [draft]);
  const canSubmit = validationMessage === '' && !isSending;

  async function sendMessage(message: string, appendUserMessage: boolean) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setErrorMessage('');
    setRetryMessage(undefined);
    setFallbackNotice(undefined);
    if (appendUserMessage) {
      setMessages((current) => [
        ...current,
        { role: 'user', content: message, createdAt: new Date().toISOString() },
      ]);
    }
    setIsSending(true);

    try {
      const response = await chatAdvisor({
        message,
        careerId: getAdvisorCareerId(),
        conversationId,
      });
      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        {
          role: 'advisor',
          content: response.answer,
          createdAt: response.createdAt,
          sources: response.sources,
          confidence: response.confidence,
          caveat: response.caveat,
          mode: response.mode,
        },
      ]);
    } catch (error: unknown) {
      setRetryMessage(message);
      setMessages((current) => [
        ...current,
        {
          role: 'advisor',
          content: buildClientFallbackAnswer(message),
          createdAt: new Date().toISOString(),
          sources: [],
          mode: 'deterministic_fallback',
        },
      ]);
      setFallbackNotice(
        isProviderFailure(error)
          ? 'The AI provider is unavailable. This local explanation is a safe fallback and was not generated by an AI provider.'
          : 'The advisor service returned an error. This local explanation is a safe fallback and was not generated by an AI provider.',
      );
      setErrorMessage('');
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  async function handleFeedback(index: number, helpful: boolean, messageCreatedAt: string) {
    if (!conversationId) return;
    try {
      await submitAdvisorFeedback({
        conversationId,
        messageCreatedAt,
        helpful,
        reason: helpful ? 'actionable' : 'other',
      });
      setMessages((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, feedbackHelpful: helpful } : item,
        ),
      );
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Feedback could not be saved.');
    }
  }

  async function handleClearHistory() {
    if (!conversationId || isSending) return;
    if (!window.confirm('Clear all messages in this advisor conversation?')) return;
    setErrorMessage('');
    try {
      await clearAdvisorHistory(conversationId);
      setConversationId(undefined);
      setMessages([
        {
          role: 'advisor',
          content: 'Your conversation was cleared. Ask me a new question to begin.',
          createdAt: new Date().toISOString(),
          sources: [],
        },
      ]);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'The conversation could not be cleared.',
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    const message = draft.trim();
    if (getValidationMessage(draft) || isSending) return;

    setDraft('');
    setShowValidation(false);
    await sendMessage(message, true);
  }

  return (
    <div className="page-frame advisor-page">
      <header className="page-frame__header">
        <div>
          <p className="eyebrow">Grounded guidance</p>
          <h1>Talk with your AI career advisor</h1>
          <p>
            Ask about your options, skill gaps, or next steps. Responses are guidance, not promises,
            and are grounded in the profile and progress saved to your account.
          </p>
        </div>
        <Badge tone="success">Personalized</Badge>
      </header>

      <Card className="advisor-card">
        <aside className="advisor-notice" aria-label="AI advisory notice">
          <span className="advisor-notice__mark" aria-hidden="true">
            i
          </span>
          <p>
            This advisor offers educational guidance, not guaranteed outcomes or professional
            advice. Compare its suggestions with your own goals and trusted human perspectives.
          </p>
        </aside>
        <div className="advisor-card__actions">
          <Button
            variant="outline"
            type="button"
            onClick={() => void handleClearHistory()}
            disabled={!conversationId || isSending}
          >
            Clear conversation
          </Button>
        </div>

        <div className="advisor-messages" aria-live="polite" aria-label="Advisor conversation">
          {messages.map((item, index) => {
            const isEndOfSenderGroup =
              index === messages.length - 1 || messages[index + 1]?.role !== item.role;
            return (
              <div
                key={`${item.createdAt}-${index}`}
                className={`advisor-message advisor-message--${item.role}`}
              >
                <span className="advisor-message__role">
                  {item.role === 'advisor' ? 'Advisor' : 'You'}
                </span>
                {item.role === 'advisor' ? (
                  renderAdvisorAnswer(item.content)
                ) : (
                  <p>{item.content}</p>
                )}
                {isEndOfSenderGroup && (
                  <time className="advisor-message__time" dateTime={item.createdAt}>
                    {formatTimestamp(item.createdAt)}
                  </time>
                )}
                {isEndOfSenderGroup && item.confidence && (
                  <small className="advisor-message__confidence">
                    {item.confidence} context confidence
                  </small>
                )}
                {isEndOfSenderGroup && item.caveat && (
                  <small className="advisor-message__caveat">{item.caveat}</small>
                )}
                {isEndOfSenderGroup && item.mode === 'deterministic_fallback' && (
                  <small className="advisor-message__mode">
                    Detailed local fallback guidance; connect a reachable AI provider for
                    model-generated answers.
                  </small>
                )}
                {isEndOfSenderGroup && item.sources && item.sources.length > 0 && (
                  <small className="advisor-message__sources">
                    Context: {item.sources.join(' · ')}
                  </small>
                )}
                {isEndOfSenderGroup && item.role === 'advisor' && conversationId && (
                  <div
                    className="advisor-message__feedback"
                    aria-label="Rate this advisor response"
                  >
                    <span>Was this useful?</span>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => void handleFeedback(index, true, item.createdAt)}
                      disabled={item.feedbackHelpful === false}
                      aria-pressed={item.feedbackHelpful === true}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => void handleFeedback(index, false, item.createdAt)}
                      disabled={item.feedbackHelpful === true}
                      aria-pressed={item.feedbackHelpful === false}
                    >
                      No
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {isSending && (
            <p className="advisor-status" role="status">
              Thinking through your saved context…
            </p>
          )}
        </div>

        {fallbackNotice && (
          <aside className="advisor-local-fallback" role="status">
            <strong>Local fallback guidance shown</strong>
            <p>{fallbackNotice}</p>
            {retryMessage && (
              <Button
                variant="outline"
                type="button"
                onClick={() => void sendMessage(retryMessage, false)}
                disabled={isSending}
              >
                Retry advisor
              </Button>
            )}
          </aside>
        )}

        {errorMessage && (
          <ErrorState
            title={
              isProviderFailure({ message: errorMessage })
                ? 'The AI provider is unavailable'
                : 'The advisor needs another try'
            }
            description={errorMessage}
            actionLabel="Retry question"
            onAction={
              retryMessage
                ? () => {
                    void sendMessage(retryMessage, false);
                  }
                : undefined
            }
          />
        )}

        <form className="advisor-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field" htmlFor="advisor-question">
            <span>Your question</span>
            <textarea
              id="advisor-question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setShowValidation(true)}
              placeholder="What should I learn first for this career path?"
              maxLength={MAX_MESSAGE_LENGTH}
              rows={4}
              disabled={isSending}
              aria-invalid={showValidation && Boolean(validationMessage)}
              aria-describedby="advisor-question-hint advisor-question-error"
            />
          </label>
          <div className="advisor-form__footer">
            <small id="advisor-question-hint">
              {draft.length}/{MAX_MESSAGE_LENGTH} · Minimum {MIN_MESSAGE_LENGTH} characters
            </small>
            <Button type="submit" disabled={!canSubmit}>
              {isSending ? 'Sending…' : 'Ask advisor'}
            </Button>
          </div>
          {showValidation && validationMessage && (
            <p className="advisor-form__error" id="advisor-question-error" role="alert">
              {validationMessage}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
