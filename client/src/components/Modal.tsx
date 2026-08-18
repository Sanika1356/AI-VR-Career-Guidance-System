import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  description?: string;
}

export function Modal({ open, title, children, onClose, description }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description ? 'modal-description' : undefined}>
        <header className="ui-modal__header">
          <div>
            <h2 className="ui-modal__title" id="modal-title">{title}</h2>
            {description && <p className="ui-modal__description" id="modal-description">{description}</p>}
          </div>
          <button ref={closeButtonRef} className="ui-modal__close" type="button" aria-label="Close dialog" onClick={onClose}>×</button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
