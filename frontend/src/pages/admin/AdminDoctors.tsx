import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { DoctorDto } from '../../types';
import { getDoctors, getSpecialties } from '../../api/doctors';
import { createDoctor } from '../../api/admin';
import { getErrorMessage } from '../../utils';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { toast } from '../../store/toasts';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<DoctorDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoctors(await getDoctors());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Doctors</h2>
          <p className="page-subtitle">Clinical staff and their specialties.</p>
        </div>
        <Button onClick={() => setCreating(true)}>Add doctor</Button>
      </div>

      {loading && <Spinner block label="Loading doctors…" />}
      {error && <p className="inline-error">{error}</p>}
      {doctors && doctors.length === 0 && (
        <EmptyState
          title="No doctors yet"
          message="Add your first doctor to start taking bookings."
          action={<Button onClick={() => setCreating(true)}>Add doctor</Button>}
        />
      )}

      {doctors && doctors.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Bio</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.fullName}</strong>
                  </td>
                  <td>
                    <Badge tone="teal">{d.specialty}</Badge>
                  </td>
                  <td className="muted">{d.bio ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateDoctorModal
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

function CreateDoctorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSpecialties()
      .then((s) => {
        setSpecialties(s);
        if (s.length > 0) setSpecialty(s[0]);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createDoctor({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        specialty,
        ...(bio.trim() ? { bio: bio.trim() } : {}),
      });
      toast('Doctor account created.', 'success');
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add doctor" onClose={onClose} wide>
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <div className="form-row">
          <label className="form-group">
            <span>Full name</span>
            <input
              className="input"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>Specialty</span>
            <select
              className="input"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="form-group">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>Phone</span>
            <input
              className="input"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        </div>
        <label className="form-group">
          <span>Temporary password</span>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="form-group">
          <span>Bio (optional)</span>
          <textarea className="input" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        {error && <p className="inline-error">{error}</p>}
        <div className="actions-row">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create doctor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
