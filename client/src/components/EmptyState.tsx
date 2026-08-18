interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="ui-state ui-state--empty" aria-labelledby="empty-state-title">
      <span className="ui-state__marker" aria-hidden="true">
        —
      </span>
      <div>
        <h2 className="ui-state__title" id="empty-state-title">
          {title}
        </h2>
        <p className="ui-state__description">{description}</p>
        {actionLabel && onAction && (
          <button className="outline-button ui-state__action" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
