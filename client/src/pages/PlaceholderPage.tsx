interface PlaceholderPageProps {
  title: string;
  description: string;
  onNavigate: (href: string) => void;
  notFound?: boolean;
}

export function PlaceholderPage({
  title,
  description,
  onNavigate,
  notFound = false,
}: PlaceholderPageProps) {
  return (
    <section className="placeholder-page" aria-labelledby="placeholder-title">
      <div className="placeholder-page__content">
        <p className="section-kicker">
          {notFound ? '404 / Uncharted route' : 'Pathfinder / Coming next'}
        </p>
        <h1 id="placeholder-title">{title}</h1>
        <p className="placeholder-page__description">{description}</p>
        <div className="placeholder-page__actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('/assessment')}
          >
            {notFound ? 'Begin the journey' : 'Preview assessment'} <span>↗</span>
          </button>
          <button
            className="text-link text-link--button"
            type="button"
            onClick={() => onNavigate('/')}
          >
            Return home <span>←</span>
          </button>
        </div>
      </div>
      <div className="placeholder-page__marker" aria-hidden="true">
        01—10
      </div>
    </section>
  );
}
