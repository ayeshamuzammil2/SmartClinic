import client from './client';
import type { NotificationDto, ReminderResponse } from '../types';

export async function getNotifications(): Promise<NotificationDto[]> {
  const res = await client.get<NotificationDto[]>('/notifications');
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await client.patch(`/notifications/${id}/read`);
}

export async function sendReminder(appointmentId: string): Promise<ReminderResponse> {
  const res = await client.post<ReminderResponse>(`/notifications/reminder/${appointmentId}`);
  return res.data;
}
