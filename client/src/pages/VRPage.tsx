import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CareerWorldCanvas } from '../components/CareerWorldCanvas';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import type { VREnvironment } from '../types/domain';
import { getVREnvironments } from '../services/vr';

interface VRPageProps {
  onNavigate: (href: string) => void;
}

export function VRPage({ onNavigate }: VRPageProps) {
  const requestedEnvironment = useMemo(
    () => new URLSearchParams(window.location.search).get('environment'),
    [],
  );
  const [environments, setEnvironments] = useState<VREnvironment[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(requestedEnvironment);
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  function loadEnvironments() {
    setStatus('loading');
    setErrorMessage('');
    getVREnvironments()
      .then((items) => {
        setEnvironments(items);
        setSelectedKey((current) =>
          current && items.some((item) => item.key === current) ? current : (items[0]?.key ?? null),
        );
        setStatus(items.length > 0 ? 'success' : 'empty');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'VR environments could not load.');
      });
  }

  useEffect(() => {
    loadEnvironments();
  }, []);

  const selected = environments.find((environment) => environment.key === selectedKey) ?? null;

  function selectEnvironment(key: string) {
    setSelectedKey(key);
    window.history.replaceState({}, '', `/vr?environment=${encodeURIComponent(key)}`);
  }

  return (
    <div className="page-frame vr-page">
      <header className="page-frame__header">
        <div>
          <p className="eyebrow">Explore before you decide</p>
          <h1>Career worlds</h1>
          <p>
            Choose a focused environment to imagine the work, tools, and questions behind a career.
            The MVP includes a small set of high-quality worlds while the broader career catalog
            remains open to future domains.
          </p>
        </div>
        <Badge tone="success">Desktop-friendly experience</Badge>
      </header>

      {status === 'loading' && (
        <LoadingState
          label="Loading career worlds"
          description="Fetching the environments available for this project."
        />
      )}
      {status === 'error' && (
        <ErrorState
          title="Career worlds are offline"
          description={errorMessage}
          actionLabel="Try again"
          onAction={loadEnvironments}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="No environments are available yet"
          description="The career catalog is still available while VR environments are being prepared."
          actionLabel="Browse careers"
          onAction={() => onNavigate('/careers')}
        />
      )}
      {status === 'success' && (
        <div className="vr-layout">
          <section className="vr-environment-list" aria-label="Available career environments">
            {environments.map((environment) => (
              <button
                key={environment.key}
                className={`vr-environment-card${selectedKey === environment.key ? ' vr-environment-card--active' : ''}`}
                type="button"
                onClick={() => selectEnvironment(environment.key)}
                aria-pressed={selectedKey === environment.key}
              >
                <span className="vr-environment-card__key">{environment.key}</span>
                <strong>{environment.title}</strong>
                <span>{environment.description}</span>
                <Badge tone={environment.available ? 'success' : 'neutral'}>
                  {environment.available ? 'Available' : 'Coming soon'}
                </Badge>
              </button>
            ))}
          </section>

          {selected && (
            <Card className="vr-stage-card">
              <CareerWorldCanvas environment={selected} />
              <div className="vr-stage-card__content">
                <p className="eyebrow">Selected environment</p>
                <h2>{selected.title}</h2>
                <p>{selected.description}</p>
                <div className="vr-stage-card__actions">
                  <Button
                    type="button"
                    onClick={() => onNavigate(`/careers/${encodeURIComponent(selected.careerId)}`)}
                  >
                    View career details
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      onNavigate(`/advisor?careerId=${encodeURIComponent(selected.careerId)}`)
                    }
                  >
                    Ask the advisor
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
