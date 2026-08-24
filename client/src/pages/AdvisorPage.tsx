import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import type { ChatMessage } from '../types/domain';
import { chatAdvisor, getAdvisorCareerId } from '../services/advisor';

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
        },
      ]);
    } catch (error: unknown) {
      setRetryMessage(message);
      setErrorMessage(
        isProviderFailure(error)
          ? 'The AI provider is unavailable, but your question is safe to retry.'
          : error instanceof Error
            ? error.message
            : 'The advisor could not respond right now.',
      );
    } finally {
      sendingRef.current = false;
      setIsSending(false);
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
                <p>{item.content}</p>
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
                {isEndOfSenderGroup && item.sources && item.sources.length > 0 && (
                  <small className="advisor-message__sources">
                    Context: {item.sources.join(' · ')}
                  </small>
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
