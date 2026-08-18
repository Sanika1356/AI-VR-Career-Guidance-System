interface LoadingStateProps {
  label?: string;
  description?: string;
}

export function LoadingState({
  label = 'Loading',
  description = 'Please wait while this page is prepared.',
}: LoadingStateProps) {
  return (
    <div className="ui-state ui-state--loading" role="status" aria-live="polite">
      <span className="ui-state__spinner" aria-hidden="true" />
      <div>
        <h2 className="ui-state__title">{label}</h2>
        <p className="ui-state__description">{description}</p>
      </div>
    </div>
  );
}
