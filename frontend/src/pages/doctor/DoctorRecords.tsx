import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { VisitRecordDto } from '../../types';
import { getRecords } from '../../api/records';
import { fmtDate, getErrorMessage } from '../../utils';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import RecordDetail from '../../components/RecordDetail';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function DoctorRecords() {
  const [records, setRecords] = useState<VisitRecordDto[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecords()
      .then((r) => setRecords([...r].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!records) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.patientId.toLowerCase().includes(q) ||
        r.appointmentId.toLowerCase().includes(q) ||
        r.icdCodes.some((c) => c.code.toLowerCase().includes(q)),
    );
  }, [records, filter]);

  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Patient records</h2>
          <p className="page-subtitle">Visit notes for patients under your care.</p>
        </div>
        <input
          className="input input--search"
          placeholder="Filter by patient ID, appointment ID or ICD code…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading && <Spinner block label="Loading records…" />}
      {error && <p className="inline-error">{error}</p>}
      {records && records.length === 0 && (
        <EmptyState
          title="No records yet"
          message="Records you create during visits will appear here."
        />
      )}

      {records && records.length > 0 && (
        <div className="records-layout">
          <ul className="records-list card">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={`records-list__item ${r.id === selectedId ? 'records-list__item--active' : ''}`}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="records-list__col">
                  <span>Visit on {fmtDate(r.createdAt)}</span>
                  <span className="muted records-list__sub">Patient {r.patientId.slice(0, 8)}…</span>
                </div>
                {r.finalized ? <Badge tone="green">Finalized</Badge> : <Badge tone="amber">Draft</Badge>}
              </li>
            ))}
            {filtered.length === 0 && <li className="muted records-list__none">No matches.</li>}
          </ul>
          <div className="card records-detail">
            {selected ? (
              <div className="stack">
                <RecordDetail record={selected} />
                {!selected.finalized && (
                  <Link to={`/doctor/visit/${selected.appointmentId}`}>
                    <Button variant="secondary">Edit in visit view</Button>
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState title="Select a record" message="Choose a visit on the left." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
