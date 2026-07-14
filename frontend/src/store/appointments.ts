import { create } from 'zustand';
import type { AppointmentDto } from '../types';
import { getAppointments, type AppointmentQuery } from '../api/appointments';
import { getErrorMessage } from '../utils';

interface AppointmentsState {
  items: AppointmentDto[];
  loading: boolean;
  error: string | null;
  fetch: (query?: AppointmentQuery) => Promise<void>;
  /** Upsert from socket events (`appointment.updated` / `appointment.checkin`). */
  upsert: (appt: AppointmentDto) => void;
  reset: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>()((set) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (query = {}) => {
    set({ loading: true, error: null });
    try {
      const items = await getAppointments(query);
      set({ items, loading: false });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  upsert: (appt) =>
    set((s) => {
      const idx = s.items.findIndex((a) => a.id === appt.id);
      if (idx === -1) return { items: [...s.items, appt] };
      const items = s.items.slice();
      items[idx] = { ...items[idx], ...appt };
      return { items };
    }),

  reset: () => set({ items: [], loading: false, error: null }),
}));
