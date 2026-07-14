import { io, Socket } from 'socket.io-client';
import { API_URL } from './api/client';
import type { AppointmentDto, NotificationDto } from './types';
import { useNotificationsStore } from './store/notifications';
import { useAppointmentsStore } from './store/appointments';
import { toast } from './store/toasts';

let socket: Socket | null = null;
let currentToken: string | null = null;

interface AppointmentEvent {
  type?: string;
  appointment?: AppointmentDto;
}

interface NotificationEvent {
  type?: string;
  notification?: NotificationDto;
}

interface QueuePositionEvent {
  type?: string;
  appointmentId?: string;
  position?: number;
}

/**
 * Connect (or reconnect with a new token) and bind store handlers.
 * Safe to call repeatedly — a same-token call is a no-op.
 */
export function connectRealtime(token: string): Socket {
  if (socket && currentToken === token && socket.connected) return socket;
  disconnectRealtime();
  currentToken = token;
  socket = io(API_URL, { auth: { token } });

  socket.on('appointment.updated', (payload: AppointmentEvent) => {
    if (payload?.appointment) useAppointmentsStore.getState().upsert(payload.appointment);
  });

  socket.on('appointment.checkin', (payload: AppointmentEvent) => {
    if (payload?.appointment) useAppointmentsStore.getState().upsert(payload.appointment);
  });

  socket.on('notification', (payload: NotificationEvent) => {
    if (payload?.notification) useNotificationsStore.getState().addFromSocket(payload.notification);
  });

  socket.on('queue.position', (payload: QueuePositionEvent) => {
    if (typeof payload?.position === 'number') {
      toast(`A slot opened up — you are #${payload.position} on the waitlist.`, 'info');
    }
  });

  return socket;
}

export function disconnectRealtime(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
}

export function getSocket(): Socket | null {
  return socket;
}
