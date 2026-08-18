interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = 'Something needs another look',
  description = 'We could not load this part of Pathfinder. Try again, or return to the previous step.',
  actionLabel = 'Try again',
  onAction,
}: ErrorStateProps) {
  return (
    <section className="ui-state ui-state--error" role="alert" aria-labelledby="error-state-title">
      <span className="ui-state__marker" aria-hidden="true">
        !
      </span>
      <div>
        <h2 className="ui-state__title" id="error-state-title">
          {title}
        </h2>
        <p className="ui-state__description">{description}</p>
        {onAction && (
          <button className="outline-button ui-state__action" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
