import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  isAuthenticated: boolean;
  onNavigate: (href: string) => void;
  onSignOut: () => void;
  userName?: string;
}

const primaryLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/careers', label: 'Career catalog' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/resume-analyzer', label: 'Resume Analyzer' },
  { href: '/advisor', label: 'AI advisor' },
];

function handleNavigation(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (path: string) => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onNavigate(href);
}

export function AppShell({
  children,
  currentPath,
  isAuthenticated,
  onNavigate,
  onSignOut,
  userName,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="/"
          aria-label="Pathfinder home"
          onClick={(event) => handleNavigation(event, '/', onNavigate)}
        >
          <span className="brand-mark">P</span>
          <span>
            pathfinder<span className="brand-dot">.</span>
          </span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                currentPath === link.href ||
                (link.href === '/resume-analyzer' && currentPath.startsWith('/resume-analyzer'))
                  ? 'topnav__link topnav__link--active'
                  : 'topnav__link'
              }
              aria-current={
                currentPath === link.href ||
                (link.href === '/resume-analyzer' && currentPath.startsWith('/resume-analyzer'))
                  ? 'page'
                  : undefined
              }
              onClick={(event) => handleNavigation(event, link.href, onNavigate)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {isAuthenticated ? (
          <div className="account-actions">
            <button className="account-link" type="button" onClick={() => onNavigate('/profile')}>
              {userName ? `Hi, ${userName.split(' ')[0]}` : 'Your profile'}
            </button>
            <button className="outline-button" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="outline-button" type="button" onClick={() => onNavigate('/login')}>
            Sign in
          </button>
        )}
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>AI-VR Career Guidance System</span> <span aria-hidden="true">•</span>{' '}
        <span>Built for curious minds</span>{' '}
        <a
          className="footer__link"
          href="/limitations"
          onClick={(event) => handleNavigation(event, '/limitations', onNavigate)}
        >
          Limitations and safeguards
        </a>
      </footer>
    </div>
  );
}
