import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg
        className="empty-state__icon"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="10" y="8" width="36" height="42" rx="6" />
        <path d="M22 8.5V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2.5" opacity="0.7" />
        <line x1="19" y1="22" x2="37" y2="22" opacity="0.55" />
        <line x1="19" y1="30" x2="33" y2="30" opacity="0.55" />
        <line x1="19" y1="38" x2="29" y2="38" opacity="0.55" />
        <circle cx="39" cy="41" r="7.5" fill="var(--page-bg, #f6f8fb)" />
        <path d="M39 37.5v7M35.5 41h7" />
      </svg>
      <h4>{title}</h4>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
