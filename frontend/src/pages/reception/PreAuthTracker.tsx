import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type {
  AppointmentDto,
  InsuranceProvider,
  PreAuthDto,
  PreAuthStatus,
} from '../../types';
import { createPreAuth, getPreAuths, updatePreAuthStatus } from '../../api/preauth';
import { getAppointments } from '../../api/appointments';
import { fmtDateTime, getErrorMessage } from '../../utils';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { PreAuthBadge } from '../../components/Badge';
import { toast } from '../../store/toasts';

const PROVIDERS: InsuranceProvider[] = ['MedGulf', 'AXA', 'Bupa'];
const STATUSES: PreAuthStatus[] = ['pending', 'submitted', 'approved', 'rejected'];

export default function PreAuthTracker() {
  const [rows, setRows] = useState<PreAuthDto[] | null>(null);
  const [filter, setFilter] = useState<PreAuthStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPreAuths(filter || undefined);
      setRows([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (row: PreAuthDto, status: 'submitted' | 'approved' | 'rejected') => {
    setActingId(row.id);
    try {
      const updated = await updatePreAuthStatus(row.id, status);
      setRows((r) => (r ? r.map((x) => (x.id === updated.id ? updated : x)) : r));
      toast(`Pre-auth ${status}.`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Insurance pre-auth tracker</h2>
          <p className="page-subtitle">
            Specialist visits need an approved pre-auth before the doctor can finalize notes.
          </p>
        </div>
        <div className="actions-row">
          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value as PreAuthStatus | '')}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={() => setCreating(true)}>New request</Button>
        </div>
      </div>

      {loading && <Spinner block label="Loading requests…" />}
      {error && <p className="inline-error">{error}</p>}
      {rows && rows.length === 0 && !loading && (
        <EmptyState
          title="No pre-auth requests"
          message="Create a request for an upcoming specialist appointment."
          action={<Button onClick={() => setCreating(true)}>New request</Button>}
        />
      )}

      {rows && rows.length > 0 && !loading && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Appointment</th>
                <th>Provider</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.appointment?.patient?.fullName ?? '—'}</td>
                  <td>
                    {row.appointment ? (
                      <>
                        {row.appointment.doctor.fullName}
                        <div className="muted">{fmtDateTime(row.appointment.startTime)}</div>
                      </>
                    ) : (
                      row.appointmentId
                    )}
                  </td>
                  <td>{row.provider}</td>
                  <td>
                    <span className="chip">{row.diagnosisCode}</span>
                    {row.notes && <div className="muted">{row.notes}</div>}
                  </td>
                  <td>
                    <PreAuthBadge status={row.status} />
                  </td>
                  <td className="muted">{fmtDateTime(row.createdAt)}</td>
                  <td>
                    <div className="actions-row actions-row--wrap">
                      {row.status === 'pending' && (
                        <Button
                          size="sm"
                          loading={actingId === row.id}
                          onClick={() => void act(row, 'submitted')}
                        >
                          Mark submitted
                        </Button>
                      )}
                      {row.status === 'submitted' && (
                        <>
                          <Button
                            size="sm"
                            loading={actingId === row.id}
                            onClick={() => void act(row, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={actingId === row.id}
                            onClick={() => void act(row, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {(row.status === 'approved' || row.status === 'rejected') && (
                        <span className="muted">
                          {row.decidedAt ? `Decided ${fmtDateTime(row.decidedAt)}` : 'Decided'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreatePreAuthModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function CreatePreAuthModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [appointments, setAppointments] = useState<AppointmentDto[] | null>(null);
  const [appointmentId, setAppointmentId] = useState('');
  const [provider, setProvider] = useState<InsuranceProvider>('MedGulf');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAppointments()
      .then((appts) => setAppointments(appts))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Pre-auth applies to specialist (non-GP) visits that are still upcoming/active.
  const candidates = useMemo(
    () =>
      (appointments ?? [])
        .filter(
          (a) =>
            a.doctor.specialty !== 'General Practice' &&
            a.status !== 'cancelled' &&
            a.status !== 'no_show',
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPreAuth({
        appointmentId,
        provider,
        diagnosisCode: diagnosisCode.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast('Pre-auth request created.', 'success');
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New pre-auth request" onClose={onClose} wide>
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <label className="form-group">
          <span>Specialist appointment</span>
          {appointments === null ? (
            <Spinner block label="Loading appointments…" />
          ) : (
            <select
              className="input"
              required
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              <option value="">Select an appointment…</option>
              {candidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.patient.fullName} → {a.doctor.fullName} ({a.doctor.specialty}) —{' '}
                  {fmtDateTime(a.startTime)}
                </option>
              ))}
            </select>
          )}
        </label>
        <div className="form-row">
          <label className="form-group">
            <span>Insurance provider</span>
            <select
              className="input"
              value={provider}
              onChange={(e) => setProvider(e.target.value as InsuranceProvider)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span>Diagnosis code</span>
            <input
              className="input"
              required
              placeholder="e.g. I20.9"
              value={diagnosisCode}
              onChange={(e) => setDiagnosisCode(e.target.value)}
            />
          </label>
        </div>
        <label className="form-group">
          <span>Notes (optional)</span>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {error && <p className="inline-error">{error}</p>}
        <div className="actions-row">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!appointmentId || !diagnosisCode.trim()}>
            Create request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
