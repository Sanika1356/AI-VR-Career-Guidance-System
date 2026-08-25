import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import type { ChatMessage } from '../types/domain';
import { chatAdvisor, clearAdvisorHistory, getAdvisorCareerId } from '../services/advisor';

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

function normalizeAdvisorMarkdown(value: string): string {
  return value
    .replace(/\\([*_`\[\]\\])/g, '$1')
    .replace(/\r\n?/g, '\n')
    .replace(
      /^\*\*(Short answer|Why this fits your context|Why it fits your context|Practical sequence|How to personalize or verify it|Recommended resources)\*\*\s*:?[ \t]*/gim,
      '## $1\n\n',
    )
    .trim();
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
    if (match[2] && match[3]) {
      nodes.push(
        <a key={`link-${key++}`} href={match[3]} target="_blank" rel="noreferrer noopener">
          {match[2]}
        </a>,
      );
    } else if (match[5]) {
      nodes.push(<strong key={`strong-${key++}`}>{match[5]}</strong>);
    } else if (match[7]) {
      nodes.push(<code key={`code-${key++}`}>{match[7]}</code>);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isListLine(line: string): boolean {
  return /^(?:[-*]\s+|\d+[.)]\s+)/.test(line.trim());
}

function renderAdvisorAnswer(answer: string) {
  const lines = normalizeAdvisorMarkdown(answer).split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockKey = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? '';
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Heading = heading[1].length === 1 ? 'h3' : heading[1].length === 2 ? 'h4' : 'h5';
      blocks.push(
        <Heading key={`heading-${blockKey++}`}>{renderInlineMarkdown(heading[2])}</Heading>,
      );
      index += 1;
      continue;
    }

    if (line === '---' || line === '***') {
      blocks.push(<hr key={`rule-${blockKey++}`} />);
      index += 1;
      continue;
    }

    if (line.includes('|') && isTableSeparator(lines[index + 1] ?? '')) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index]?.includes('|')) {
        rows.push(splitTableRow(lines[index] ?? ''));
        index += 1;
      }
      blocks.push(
        <div className="advisor-message__table-wrap" key={`table-${blockKey++}`}>
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{renderInlineMarkdown(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((_, columnIndex) => (
                    <td key={`cell-${rowIndex}-${columnIndex}`}>
                      {renderInlineMarkdown(row[columnIndex] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (isListLine(line)) {
      const ordered = /^\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length && isListLine(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/, '').trim());
        index += 1;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={`list-${blockKey++}`}>
          {items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </List>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !/^(#{1,3})\s+/.test(lines[index]?.trim() ?? '') &&
      !isListLine(lines[index]?.trim() ?? '') &&
      lines[index]?.trim() !== '---' &&
      lines[index]?.trim() !== '***'
    ) {
      paragraph.push(lines[index]?.trim() ?? '');
      index += 1;
    }
    blocks.push(<p key={`paragraph-${blockKey++}`}>{renderInlineMarkdown(paragraph.join(' '))}</p>);
  }

  return <div className="advisor-message__answer">{blocks}</div>;
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
