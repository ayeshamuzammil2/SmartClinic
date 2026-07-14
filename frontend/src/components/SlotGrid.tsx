import { useEffect, useState, type ReactNode } from 'react';
import type { SlotDto } from '../types';
import { getSlots } from '../api/appointments';
import { fmtTime, getErrorMessage } from '../utils';
import Spinner from './Spinner';

interface SlotGridProps {
  doctorId: string;
  date: string; // YYYY-MM-DD
  value: string | null; // selected startTime ISO
  onSelect: (slot: SlotDto) => void;
  /** Rendered when the day has zero available slots (e.g. a waitlist button). */
  renderNoSlots?: () => ReactNode;
}

export default function SlotGrid({ doctorId, date, value, onSelect, renderNoSlots }: SlotGridProps) {
  const [slots, setSlots] = useState<SlotDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSlots(null);
    getSlots(doctorId, date)
      .then((s) => {
        if (!cancelled) setSlots(s);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  if (loading) return <Spinner block label="Loading slots…" />;
  if (error) return <p className="inline-error">{error}</p>;
  if (!slots) return null;

  const anyAvailable = slots.some((s) => s.available);
  if (!anyAvailable) {
    return (
      <div className="slot-grid__empty">
        <p>No free slots on this day.</p>
        {renderNoSlots?.()}
      </div>
    );
  }

  return (
    <div className="slot-grid">
      {slots.map((slot) => (
        <button
          key={slot.startTime}
          type="button"
          disabled={!slot.available}
          className={`slot ${!slot.available ? 'slot--taken' : ''} ${
            value === slot.startTime ? 'slot--selected' : ''
          }`}
          onClick={() => onSelect(slot)}
        >
          {fmtTime(slot.startTime)}
        </button>
      ))}
    </div>
  );
}
