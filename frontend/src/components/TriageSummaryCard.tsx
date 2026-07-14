import type { TriageSummary } from '../types';
import { IconWarning } from './Icons';

export default function TriageSummaryCard({ summary }: { summary: TriageSummary }) {
  return (
    <div className="triage-card">
      <dl className="triage-card__grid">
        <div>
          <dt>Chief complaint</dt>
          <dd>{summary.chiefComplaint || '—'}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>
            {summary.symptomDurationDays} day{summary.symptomDurationDays === 1 ? '' : 's'}
          </dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>
            <span className={`severity severity--${severityBand(summary.severity)}`}>
              {summary.severity} / 10
            </span>
          </dd>
        </div>
        <div>
          <dt>Relevant history</dt>
          <dd>{summary.relevantHistory || 'None reported'}</dd>
        </div>
        <div>
          <dt>Current medications</dt>
          <dd>{summary.currentMedications || 'None reported'}</dd>
        </div>
      </dl>
      {summary.redFlags.length > 0 && (
        <div className="triage-card__redflags">
          <span className="triage-card__redflags-title">
            <IconWarning size={16} /> Red flags
          </span>
          <ul>
            {summary.redFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function severityBand(severity: number): 'low' | 'mid' | 'high' {
  if (severity >= 7) return 'high';
  if (severity >= 4) return 'mid';
  return 'low';
}
