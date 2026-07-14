import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import { Appointment, Notification } from '../entities';
import { AppointmentStatus, Role } from '../common/enums';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private logger = new Logger('Notifications');

  constructor(
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(Appointment) private appointments: Repository<Appointment>,
    private gateway: NotificationsGateway,
  ) {}

  /** Persist a notification row and push it over the socket. */
  async notify(userId: string, type: string, payload: Record<string, any>) {
    const row = await this.notifications.save(
      this.notifications.create({ userId, type, payload }),
    );
    this.gateway.emitToUser(userId, 'notification', { notification: row });
    return row;
  }

  listForUser(userId: string) {
    return this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const row = await this.notifications.findOneBy({ id, userId });
    if (!row) throw new NotFoundException('Notification not found');
    row.read = true;
    return this.notifications.save(row);
  }

  /** Mock WhatsApp/SMS reminder for a flagged appointment (receptionist action). */
  async sendMockReminder(appointmentId: string) {
    const appt = await this.appointments.findOne({
      where: { id: appointmentId },
      relations: { patient: true, doctor: true },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    this.logger.log(
      `[MOCK SMS] to ${appt.patient.phone ?? 'unknown'}: Reminder for your ` +
      `appointment with ${appt.doctor.fullName} at ${appt.startTime.toISOString()}`,
    );
    await this.notify(appt.patientId, 'reminder.manual', {
      appointmentId: appt.id,
      startTime: appt.startTime,
      doctorName: appt.doctor.fullName,
      channel: 'sms',
    });
    return { sent: true, channel: 'sms', to: appt.patient.phone ?? 'unknown' };
  }

  /** Automated 24h and 1h reminders — runs every 5 minutes. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendScheduledReminders() {
    const now = Date.now();
    await this.remindWindow(new Date(now + 23.9 * 3600000), new Date(now + 24.1 * 3600000), 'reminded24h', '24h');
    await this.remindWindow(new Date(now + 55 * 60000), new Date(now + 65 * 60000), 'reminded1h', '1h');
  }

  private async remindWindow(
    from: Date, to: Date, flag: 'reminded24h' | 'reminded1h', label: string,
  ) {
    const due = await this.appointments.find({
      where: {
        startTime: Between(from, to),
        status: AppointmentStatus.SCHEDULED,
        [flag]: false,
      } as any,
      relations: { doctor: true },
    });
    for (const appt of due) {
      await this.notify(appt.patientId, `reminder.${label}`, {
        appointmentId: appt.id,
        startTime: appt.startTime,
        doctorName: appt.doctor.fullName,
      });
      await this.appointments.update(appt.id, { [flag]: true } as any);
    }
  }

  emitQueuePosition(patientId: string, appointmentId: string, position: number) {
    this.gateway.emitToUser(patientId, 'queue.position', { appointmentId, position });
  }

  emitAppointmentUpdate(appointment: Appointment) {
    const payload = { appointment };
    this.gateway.emitToUser(appointment.patientId, 'appointment.updated', payload);
    this.gateway.emitToUser(appointment.doctorId, 'appointment.updated', payload);
    this.gateway.emitToRole(Role.RECEPTIONIST, 'appointment.updated', payload);
    if (appointment.status === AppointmentStatus.CHECKED_IN) {
      this.gateway.emitToRole(Role.RECEPTIONIST, 'appointment.checkin', payload);
      this.gateway.emitToUser(appointment.doctorId, 'appointment.checkin', payload);
    }
  }
}
