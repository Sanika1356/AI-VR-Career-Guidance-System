import { useEffect, useState } from 'react';
import { StatusPill } from './components/StatusPill';
import { AppShell } from './layouts/AppShell';
import { AuthRequiredPage } from './pages/AuthRequiredPage';
import { AuthPage } from './pages/AuthPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProfilePage } from './pages/ProfilePage';
import { clearAuthSession, readAuthSession } from './services/auth';
import { getHealth } from './services/api';

type RouteKey =
  | 'home'
  | 'register'
  | 'login'
  | 'profile'
  | 'assessment'
  | 'recommendations'
  | 'career-details'
  | 'skill-gap'
  | 'roadmap'
  | 'advisor'
  | 'vr'
  | 'not-found';

interface RouteState {
  key: RouteKey;
  careerId?: string;
}

const routes: Record<
  Exclude<RouteKey, 'home' | 'career-details' | 'not-found'>,
  { title: string; description: string }
> = {
  register: {
    title: 'Create your Pathfinder account',
    description:
      'Registration will collect the details needed to personalize your career discovery journey.',
  },
  login: {
    title: 'Welcome back',
    description:
      'Sign in to continue your assessment, roadmap, advisor conversation, and VR exploration.',
  },
  profile: {
    title: 'Your profile',
    description:
      'Review your interests, skills, learning preferences, experience level, and goals.',
  },
  assessment: {
    title: 'Discover your direction',
    description:
      'Answer a focused set of questions to surface the career patterns that fit you best.',
  },
  recommendations: {
    title: 'Career recommendations',
    description:
      'Explore ranked career paths with transparent reasons, matched skills, and next steps.',
  },
  'skill-gap': {
    title: 'Understand your skill gap',
    description: 'See which skills are matched, developing, or ready for focused learning.',
  },
  roadmap: {
    title: 'Build your learning roadmap',
    description: 'Turn your target career into an ordered set of practical learning steps.',
  },
  advisor: {
    title: 'Talk with your AI career advisor',
    description:
      'Ask thoughtful questions and receive guidance grounded in your goals and progress.',
  },
  vr: {
    title: 'Explore career worlds',
    description: 'Enter a desktop-friendly 3D career hub and discover immersive environments.',
  },
};

const protectedRouteKeys = new Set<RouteKey>([
  'profile',
  'assessment',
  'recommendations',
  'career-details',
  'skill-gap',
  'roadmap',
  'advisor',
  'vr',
]);

function getRoute(pathname: string): RouteState {
  const pathOnly = pathname.split('?')[0].split('#')[0];
  const normalizedPath = pathOnly.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/') return { key: 'home' };
  if (normalizedPath === '/careers' || normalizedPath.startsWith('/careers/')) {
    return normalizedPath === '/careers'
      ? { key: 'not-found' }
      : { key: 'career-details', careerId: normalizedPath.split('/')[2] };
  }

  const key = normalizedPath.slice(1) as Exclude<RouteKey, 'home' | 'career-details' | 'not-found'>;
  return key in routes ? { key } : { key: 'not-found' };
}

function useRoute() {
  const [route, setRoute] = useState<RouteState>(() => getRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (href: string) => {
    if (!href.startsWith('/')) return;
    window.history.pushState({}, '', href);
    setRoute(getRoute(href));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { route, navigate };
}

function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <>
      <section className="hero" id="journey">
        <div className="hero-copy">
          <StatusPill
            label={
              apiStatus === 'online'
                ? 'API connected'
                : apiStatus === 'offline'
                  ? 'API offline'
                  : 'Connecting to API'
            }
            tone={
              apiStatus === 'online' ? 'success' : apiStatus === 'offline' ? 'warning' : 'neutral'
            }
          />
          <p className="eyebrow">A clearer direction starts here</p>
          <h1>
            Meet the future
            <br />
            <em>you.</em>
          </h1>
          <p className="hero-text">
            Discover where your strengths can take you. Pathfinder combines thoughtful assessment,
            practical roadmaps, and immersive career worlds to help you move forward with
            confidence.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => onNavigate('/register')}
            >
              Start your discovery <span>↗</span>
            </button>
            <a className="text-link" href="#explore">
              Browse career paths <span>↓</span>
            </a>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Abstract career discovery visualization"
          role="img"
        >
          <div className="orb orb--large">
            <span>
              YOUR
              <br />
              POTENTIAL
            </span>
          </div>
          <div className="orb orb--small">
            <span>01</span>
          </div>
          <div className="orbit orbit--one" />
          <div className="orbit orbit--two" />
          <div className="visual-caption">01 / Begin with curiosity</div>
        </div>
      </section>

      <section className="intro-grid" id="explore">
        <p className="section-kicker">The path is yours</p>
        <div>
          <h2>
            Turn uncertainty into <em>momentum.</em>
          </h2>
          <p className="section-text">
            Your career does not have to be a single decision. Start with a signal, test your
            interests, and build the skills that make your next step feel possible.
          </p>
        </div>
      </section>

      <section className="feature-grid" aria-label="Product capabilities">
        <article className="feature-card feature-card--dark">
          <span className="feature-number">01</span>
          <h3>
            Know your
            <br />
            <em>strengths.</em>
          </h3>
          <p>A focused assessment surfaces the patterns behind what energizes you.</p>
        </article>
        <article className="feature-card feature-card--warm">
          <span className="feature-number">02</span>
          <h3>
            See what
            <br />
            <em>fits.</em>
          </h3>
          <p>Explore career paths matched to your interests, skills, and ambitions.</p>
        </article>
        <article className="feature-card feature-card--lavender">
          <span className="feature-number">03</span>
          <h3>
            Make it
            <br />
            <em>real.</em>
          </h3>
          <p>Step into immersive worlds and leave with a roadmap you can act on.</p>
        </article>
      </section>
    </>
  );
}

export default function App() {
  const { route, navigate } = useRoute();
  const [session, setSession] = useState(() => readAuthSession());
  const [sessionExpired, setSessionExpired] = useState(false);
  const isHome = route.key === 'home';
  const isProtectedRoute = protectedRouteKeys.has(route.key);
  const placeholder =
    route.key !== 'home' &&
    route.key !== 'not-found' &&
    route.key !== 'career-details' &&
    route.key !== 'register' &&
    route.key !== 'login' &&
    route.key !== 'profile'
      ? routes[route.key]
      : undefined;

  useEffect(() => {
    const syncSession = () => setSession(readAuthSession());
    const handleSessionExpired = () => {
      const currentRoute = getRoute(window.location.pathname);
      if (!protectedRouteKeys.has(currentRoute.key)) return;

      const returnTo = `${window.location.pathname}${window.location.search}`;
      setSession(null);
      setSessionExpired(true);
      navigate(`/login?reason=session-expired&returnTo=${encodeURIComponent(returnTo)}`);
    };

    window.addEventListener('pathfinder:auth-changed', syncSession);
    window.addEventListener('pathfinder:session-expired', handleSessionExpired);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('pathfinder:auth-changed', syncSession);
      window.removeEventListener('pathfinder:session-expired', handleSessionExpired);
      window.removeEventListener('storage', syncSession);
    };
  }, [navigate]);

  const handleAuthSuccess = () => {
    setSession(readAuthSession());
    setSessionExpired(false);

    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    const safeReturnPath =
      returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/profile';
    navigate(safeReturnPath);
  };

  const handleSignOut = () => {
    clearAuthSession();
    setSessionExpired(false);
    navigate('/');
  };

  return (
    <AppShell
      currentPath={window.location.pathname}
      isAuthenticated={Boolean(session)}
      onNavigate={navigate}
      onSignOut={handleSignOut}
      userName={session?.user.name}
    >
      {isHome && <HomePage onNavigate={navigate} />}
      {route.key === 'register' && (
        <AuthPage mode="register" onNavigate={navigate} onSuccess={handleAuthSuccess} />
      )}
      {route.key === 'login' && (
        <AuthPage mode="login" onNavigate={navigate} onSuccess={handleAuthSuccess} />
      )}
      {isProtectedRoute && !session && (
        <AuthRequiredPage onNavigate={navigate} sessionExpired={sessionExpired} />
      )}
      {route.key === 'profile' && session && <ProfilePage />}
      {placeholder && session && (
        <PlaceholderPage
          title={placeholder.title}
          description={placeholder.description}
          onNavigate={navigate}
        />
      )}
      {route.key === 'career-details' && session && (
        <PlaceholderPage
          title="Career details"
          description={`A closer look at ${route.careerId?.replace(/-/g, ' ') || 'this career path'}, including skills, resources, and VR availability.`}
          onNavigate={navigate}
        />
      )}
      {route.key === 'not-found' && (
        <PlaceholderPage
          title="That path is still undiscovered"
          description="The page you requested does not exist yet. Return home to continue exploring Pathfinder."
          onNavigate={navigate}
          notFound
        />
      )}
    </AppShell>
  );
}
