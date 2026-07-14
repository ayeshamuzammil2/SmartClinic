import { useEffect, useMemo, useState } from 'react';
import type { DoctorDto, SlotDto } from '../../types';
import { getDoctors } from '../../api/doctors';
import { createAppointment, getAppointments } from '../../api/appointments';
import { fmtDateTime, getErrorMessage, todayStr } from '../../utils';
import Button from '../../components/Button';
import SlotGrid from '../../components/SlotGrid';
import { toast } from '../../store/toasts';

interface KnownPatient {
  id: string;
  fullName: string;
  phone: string | null;
}

export default function WalkInBooking() {
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [knownPatients, setKnownPatients] = useState<KnownPatient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<SlotDto | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);

  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch((err) => setError(getErrorMessage(err)));
    // Known patients, harvested from the (receptionist-visible) appointment list.
    getAppointments()
      .then((appts) => {
        const seen = new Map<string, KnownPatient>();
        for (const a of appts) {
          if (!seen.has(a.patientId)) {
            seen.set(a.patientId, {
              id: a.patientId,
              fullName: a.patient.fullName,
              phone: a.patient.phone,
            });
          }
        }
        setKnownPatients([...seen.values()].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      })
      .catch(() => undefined);
  }, []);

  const selectedPatient = useMemo(
    () => knownPatients.find((p) => p.id === patientId.trim()) ?? null,
    [knownPatients, patientId],
  );

  const doctor = doctors.find((d) => d.id === doctorId) ?? null;

  const submit = async () => {
    if (!patientId.trim() || !doctorId || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const appt = await createAppointment({
        doctorId,
        startTime: slot.startTime,
        patientId: patientId.trim(),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setBooked(
        `Booked ${appt.patient.fullName} with ${appt.doctor.fullName} — ${fmtDateTime(appt.startTime)}`,
      );
      toast('Appointment booked.', 'success');
      setSlot(null);
      setReason('');
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      setError(status === 409 ? 'That slot was just taken — pick another one.' : getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <div>
          <h2>Book for a patient</h2>
          <p className="page-subtitle">Walk-in and phone bookings on behalf of any patient.</p>
        </div>
      </div>

      {booked && <div className="success-banner">{booked}</div>}

      <div className="card stack">
        <label className="form-group">
          <span>Patient ID</span>
          <input
            className="input"
            list="known-patients"
            placeholder="Paste the patient's ID, or pick a returning patient…"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <datalist id="known-patients">
            {knownPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.phone ? `(${p.phone})` : ''}
              </option>
            ))}
          </datalist>
          {selectedPatient && (
            <span className="success-text">
              {selectedPatient.fullName}
              {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ''}
            </span>
          )}
        </label>

        <div className="form-row">
          <label className="form-group">
            <span>Doctor</span>
            <select
              className="input"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setSlot(null);
              }}
            >
              <option value="">Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.specialty}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span>Date</span>
            <input
              className="input"
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
            />
          </label>
        </div>

        {doctor && date && (
          <SlotGrid
            doctorId={doctor.id}
            date={date}
            value={slot?.startTime ?? null}
            onSelect={setSlot}
            renderNoSlots={() => <p className="muted">Try another day or doctor.</p>}
          />
        )}

        <label className="form-group">
          <span>Reason (optional)</span>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>

        {error && <p className="inline-error">{error}</p>}
        <div className="actions-row">
          <Button
            disabled={!patientId.trim() || !doctorId || !slot}
            loading={submitting}
            onClick={() => void submit()}
          >
            Book appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
