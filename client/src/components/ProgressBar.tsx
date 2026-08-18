interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, label = 'Progress', showValue = true }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  return (
    <div className="ui-progress">
      <div className="ui-progress__header">
        <span className="ui-progress__label">{label}</span>
        {showValue && <span className="ui-progress__value">{percentage}%</span>}
      </div>
      <div className="ui-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue}>
        <span className="ui-progress__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
