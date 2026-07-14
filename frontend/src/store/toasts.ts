import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React components. */
export function toast(message: string, kind: ToastKind = 'info'): void {
  useToastStore.getState().push(message, kind);
}
