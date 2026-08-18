import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pathfinder home">
          <span className="brand-mark">P</span>
          <span>pathfinder<span className="brand-dot">.</span></span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#journey">Your journey</a>
          <a href="#explore">Explore careers</a>
        </nav>
        <button className="outline-button" type="button">Sign in</button>
      </header>
      <main>{children}</main>
      <footer className="footer">AI-VR Career Guidance System <span>•</span> Built for curious minds</footer>
    </div>
  );
}
