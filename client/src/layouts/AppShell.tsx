import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (href: string) => void;
}

const primaryLinks = [
  { href: '/assessment', label: 'Assessment' },
  { href: '/recommendations', label: 'Career paths' },
  { href: '/vr', label: 'VR experience' },
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

export function AppShell({ children, currentPath, onNavigate }: AppShellProps) {
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
                currentPath === link.href ? 'topnav__link topnav__link--active' : 'topnav__link'
              }
              aria-current={currentPath === link.href ? 'page' : undefined}
              onClick={(event) => handleNavigation(event, link.href, onNavigate)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button className="outline-button" type="button" onClick={() => onNavigate('/login')}>
          Sign in
        </button>
      </header>
      <main>{children}</main>
      <footer className="footer">
        AI-VR Career Guidance System <span>•</span> Built for curious minds
      </footer>
    </div>
  );
}
