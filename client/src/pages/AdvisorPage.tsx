import { FormEvent, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import type { ChatMessage } from '../types/domain';
import { chatAdvisor, getAdvisorCareerId } from '../services/advisor';

export function AdvisorPage() {
  const [conversationId, setConversationId] = useState<string | undefined>();
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

  async function sendMessage(message: string, appendUserMessage: boolean) {
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
        },
      ]);
    } catch (error: unknown) {
      setRetryMessage(message);
      setErrorMessage(error instanceof Error ? error.message : 'The advisor could not respond.');
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (message.length < 3 || message.length > 2000 || isSending) return;

    setDraft('');
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
        <div className="advisor-messages" aria-live="polite" aria-label="Advisor conversation">
          {messages.map((item, index) => (
            <div
              key={`${item.createdAt}-${index}`}
              className={`advisor-message advisor-message--${item.role}`}
            >
              <span className="advisor-message__role">{item.role === 'advisor' ? 'Advisor' : 'You'}</span>
              <p>{item.content}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
              {item.sources && item.sources.length > 0 && (
                <small>Context: {item.sources.join(' · ')}</small>
              )}
            </div>
          ))}
          {isSending && <p className="advisor-status">Thinking through your saved context…</p>}
        </div>

        {errorMessage && (
          <ErrorState
            title="The advisor is temporarily unavailable"
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

        <form className="advisor-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Your question</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What should I learn first for this career path?"
              maxLength={2000}
              rows={4}
              disabled={isSending}
              required
            />
          </label>
          <div className="advisor-form__footer">
            <small>{draft.length}/2000 · Minimum 3 characters</small>
            <Button type="submit" disabled={isSending || draft.trim().length < 3}>
              {isSending ? 'Sending…' : 'Ask advisor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
