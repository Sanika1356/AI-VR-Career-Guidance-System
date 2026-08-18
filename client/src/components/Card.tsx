import type { ElementType, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  as?: ElementType;
  className?: string;
}

export function Card({ children, title, description, as: Component = 'article', className = '' }: CardProps) {
  return (
    <Component className={`ui-card ${className}`.trim()}>
      {(title || description) && (
        <header className="ui-card__header">
          {title && <h2 className="ui-card__title">{title}</h2>}
          {description && <p className="ui-card__description">{description}</p>}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </Component>
  );
}
