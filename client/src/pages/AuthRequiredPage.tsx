import { Button } from '../components/Button';

interface AuthRequiredPageProps {
  onNavigate: (href: string) => void;
  sessionExpired?: boolean;
}

export function AuthRequiredPage({ onNavigate, sessionExpired = false }: AuthRequiredPageProps) {
  return (
    <section className="auth-required" aria-labelledby="auth-required-title">
      <p className="eyebrow">A private path</p>
      <h1 id="auth-required-title">
        {sessionExpired ? 'Your session has ended.' : 'Sign in to continue.'}
      </h1>
      <p>
        {sessionExpired
          ? 'For your security, Pathfinder cleared the expired session. Sign in again to pick up where you left off.'
          : 'Create an account or sign in to access your assessment, recommendations, roadmap, and career worlds.'}
      </p>
      <div className="auth-required__actions">
        <Button type="button" onClick={() => onNavigate('/login')}>
          Sign in <span aria-hidden="true">↗</span>
        </Button>
        <Button variant="outline" type="button" onClick={() => onNavigate('/register')}>
          Create an account
        </Button>
      </div>
    </section>
  );
}
