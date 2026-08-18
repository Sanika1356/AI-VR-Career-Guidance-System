import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && <p className="ui-field__hint" id={hintId}>{hint}</p>}
      {error && <p className="ui-field__error" id={errorId} role="alert">{error}</p>}
    </div>
  );
});
