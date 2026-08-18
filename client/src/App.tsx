import { useEffect, useState } from 'react';
import { StatusPill } from './components/StatusPill';
import { AppShell } from './layouts/AppShell';
import { getHealth } from './services/api';

export default function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <AppShell>
      <section className="hero" id="journey">
        <div className="hero-copy">
          <StatusPill label={apiStatus === 'online' ? 'API connected' : apiStatus === 'offline' ? 'API offline' : 'Connecting to API'} tone={apiStatus === 'online' ? 'success' : apiStatus === 'offline' ? 'warning' : 'neutral'} />
          <p className="eyebrow">A clearer direction starts here</p>
          <h1>Meet the future<br /><em>you.</em></h1>
          <p className="hero-text">Discover where your strengths can take you. Pathfinder combines thoughtful assessment, practical roadmaps, and immersive career worlds to help you move forward with confidence.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button">Start your discovery <span>↗</span></button>
            <a className="text-link" href="#explore">Browse career paths <span>↓</span></a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Abstract career discovery visualization" role="img">
          <div className="orb orb--large"><span>YOUR<br />POTENTIAL</span></div>
          <div className="orb orb--small"><span>01</span></div>
          <div className="orbit orbit--one" />
          <div className="orbit orbit--two" />
          <div className="visual-caption">01 / Begin with curiosity</div>
        </div>
      </section>

      <section className="intro-grid" id="explore">
        <p className="section-kicker">The path is yours</p>
        <div>
          <h2>Turn uncertainty into <em>momentum.</em></h2>
          <p className="section-text">Your career does not have to be a single decision. Start with a signal, test your interests, and build the skills that make your next step feel possible.</p>
        </div>
      </section>

      <section className="feature-grid" aria-label="Product capabilities">
        <article className="feature-card feature-card--dark"><span className="feature-number">01</span><h3>Know your<br /><em>strengths.</em></h3><p>A focused assessment surfaces the patterns behind what energizes you.</p></article>
        <article className="feature-card feature-card--warm"><span className="feature-number">02</span><h3>See what<br /><em>fits.</em></h3><p>Explore career paths matched to your interests, skills, and ambitions.</p></article>
        <article className="feature-card feature-card--lavender"><span className="feature-number">03</span><h3>Make it<br /><em>real.</em></h3><p>Step into immersive worlds and leave with a roadmap you can act on.</p></article>
      </section>
    </AppShell>
  );
}
