import type { ReactNode } from 'react';
import type { AppointmentStatus, Confidence, PreAuthStatus } from '../types';
import { statusLabel } from '../utils';

export type BadgeTone =
  | 'blue'
  | 'teal'
  | 'amber'
  | 'green'
  | 'red'
  | 'gray'
  | 'violet';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  title?: string;
}

export default function Badge({ tone = 'gray', children, title }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  scheduled: 'blue',
  checked_in: 'teal',
  in_progress: 'violet',
  completed: 'green',
  cancelled: 'gray',
  no_show: 'red',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{statusLabel(status)}</Badge>;
}

const PREAUTH_TONE: Record<PreAuthStatus, BadgeTone> = {
  pending: 'gray',
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
};

export function PreAuthBadge({ status }: { status: PreAuthStatus }) {
  return <Badge tone={PREAUTH_TONE[status]}>{status}</Badge>;
}

const CONFIDENCE_TONE: Record<Confidence, BadgeTone> = {
  low: 'red',
  medium: 'amber',
  high: 'green',
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <Badge tone={CONFIDENCE_TONE[confidence]}>{confidence} confidence</Badge>;
}
