import type { ReactNode } from 'react';

interface NotificationProps {
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onDismiss?: () => void;
}

export function Notification({ children, tone = 'info', title, onDismiss }: NotificationProps) {
  return (
    <aside className={`ui-notification ui-notification--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <div className="ui-notification__content">
        {title && <strong className="ui-notification__title">{title}</strong>}
        <span className="ui-notification__message">{children}</span>
      </div>
      {onDismiss && (
        <button className="ui-notification__dismiss" type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
      )}
    </aside>
  );
}
