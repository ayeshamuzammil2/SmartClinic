import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, size === 'sm' ? 'btn--sm' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
