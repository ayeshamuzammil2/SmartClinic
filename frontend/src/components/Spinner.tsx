interface SpinnerProps {
  size?: number;
  /** Center it in a padded block (for page/section loading). */
  block?: boolean;
  label?: string;
}

export default function Spinner({ size = 22, block = false, label }: SpinnerProps) {
  const spinner = (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label={label ?? 'Loading'}
    />
  );
  if (!block) return spinner;
  return (
    <div className="spinner-block">
      {spinner}
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}
