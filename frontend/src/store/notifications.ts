import { create } from 'zustand';
import type { NotificationDto } from '../types';
import { getNotifications, markNotificationRead } from '../api/notifications';
import { toast } from './toasts';

/** Best-effort human text for a notification row / socket event. */
export function notificationText(n: NotificationDto): string {
  const p = n.payload ?? {};
  const msg = p['message'] ?? p['text'] ?? p['body'];
  if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  return n.type.replace(/[._]/g, ' ');
}

interface NotificationsState {
  items: NotificationDto[];
  unread: number;
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  /** Called for live socket `notification` events — prepends + toasts. */
  addFromSocket: (n: NotificationDto) => void;
  reset: () => void;
}

function countUnread(items: NotificationDto[]): number {
  return items.filter((n) => !n.read).length;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  unread: 0,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await getNotifications();
      set({ items, unread: countUnread(items), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const { items } = get();
    const target = items.find((n) => n.id === id);
    if (!target || target.read) return;
    const next = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({ items: next, unread: countUnread(next) });
    try {
      await markNotificationRead(id);
    } catch {
      // revert on failure
      const reverted = get().items.map((n) => (n.id === id ? { ...n, read: false } : n));
      set({ items: reverted, unread: countUnread(reverted) });
    }
  },

  addFromSocket: (n) => {
    set((s) => {
      if (s.items.some((existing) => existing.id === n.id)) return s;
      const items = [n, ...s.items];
      return { items, unread: countUnread(items) };
    });
    toast(notificationText(n), 'info');
  },

  reset: () => set({ items: [], unread: 0, loading: false }),
}));
