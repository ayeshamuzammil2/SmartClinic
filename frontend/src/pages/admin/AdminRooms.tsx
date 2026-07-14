import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { RoomDto } from '../../types';
import { createRoom, getRooms } from '../../api/admin';
import { getErrorMessage } from '../../utils';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../store/toasts';

export default function AdminRooms() {
  const [rooms, setRooms] = useState<RoomDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await getRooms());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await createRoom(name.trim(), branch.trim());
      toast('Room created.', 'success');
      setName('');
      setBranch('');
      void load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Rooms</h2>
          <p className="page-subtitle">Consultation rooms across clinic branches.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3 className="card__title">All rooms</h3>
          {loading && <Spinner block label="Loading rooms…" />}
          {error && <p className="inline-error">{error}</p>}
          {rooms && rooms.length === 0 && (
            <EmptyState title="No rooms yet" message="Add the first room using the form." />
          )}
          {rooms && rooms.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Branch</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>{r.branch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h3 className="card__title">Add a room</h3>
          <form className="stack" onSubmit={(e) => void submit(e)}>
            <label className="form-group">
              <span>Room name</span>
              <input
                className="input"
                required
                placeholder="e.g. Consultation 3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="form-group">
              <span>Branch</span>
              <input
                className="input"
                required
                placeholder="e.g. Main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </label>
            {formError && <p className="inline-error">{formError}</p>}
            <div className="actions-row">
              <Button type="submit" loading={saving}>
                Create room
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
