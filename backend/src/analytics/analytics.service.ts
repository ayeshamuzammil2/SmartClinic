import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, DoctorProfile, PreAuth } from '../entities';
import { AppointmentStatus } from '../common/enums';

const SLOTS_PER_DAY = 16; // 09:00–17:00, 30-min slots

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Appointment) private appointments: Repository<Appointment>,
    @InjectRepository(DoctorProfile) private profiles: Repository<DoctorProfile>,
    @InjectRepository(PreAuth) private preauths: Repository<PreAuth>,
  ) {}

  /** Occupancy per doctor: booked active appointments vs slot capacity. */
  async occupancy(period: 'daily' | 'weekly') {
    const days = period === 'weekly' ? 7 : 1;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const rows = await this.appointments
      .createQueryBuilder('a')
      .select('a."doctorId"', 'doctorId')
      .addSelect('COUNT(*)', 'booked')
      .where('a."startTime" >= :from', { from })
      .andWhere('a."startTime" <= now()')
      .andWhere('a.status NOT IN (:...excluded)', {
        excluded: [AppointmentStatus.CANCELLED],
      })
      .groupBy('a."doctorId"')
      .getRawMany();

    const profiles = await this.profiles.find({ relations: { user: true } });
    const weekdays = Math.max(1, Math.round(days * 5 / 7));
    const capacity = SLOTS_PER_DAY * weekdays;

    return profiles.map((p) => {
      const row = rows.find((r) => r.doctorId === p.userId);
      const booked = row ? parseInt(row.booked, 10) : 0;
      return {
        doctorId: p.userId,
        doctorName: p.user.fullName,
        specialty: p.specialty,
        booked,
        capacity,
        rate: Math.round((booked / capacity) * 1000) / 10,
      };
    });
  }

  /** No-show rate per day over the last 30 days. */
  async noShowTrend() {
    const rows = await this.appointments
      .createQueryBuilder('a')
      .select(`to_char(a."startTime", 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE a.status = '${AppointmentStatus.NO_SHOW}')`,
        'noShows',
      )
      .where(`a."startTime" >= now() - interval '30 days'`)
      .andWhere('a."startTime" <= now()')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      date: r.date,
      total: parseInt(r.total, 10),
      noShows: parseInt(r.noShows, 10),
      rate: r.total > 0
        ? Math.round((parseInt(r.noShows, 10) / parseInt(r.total, 10)) * 1000) / 10
        : 0,
    }));
  }

  /** Average consultation duration (check-in → completed) by specialty. */
  async consultationDuration() {
    const rows = await this.appointments
      .createQueryBuilder('a')
      .innerJoin(DoctorProfile, 'p', 'p."userId" = a."doctorId"')
      .select('p.specialty', 'specialty')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (a."completedAt" - a."startTime")) / 60)`,
        'avgMinutes',
      )
      .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .andWhere('a."completedAt" IS NOT NULL')
      .groupBy('p.specialty')
      .getRawMany();

    return rows.map((r) => ({
      specialty: r.specialty,
      avgMinutes: Math.round(parseFloat(r.avgMinutes) * 10) / 10,
    }));
  }

  /** Approval rate + average turnaround per insurance provider. */
  async insuranceStats() {
    const rows = await this.preauths
      .createQueryBuilder('pa')
      .select('pa.provider', 'provider')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE pa.status = 'approved')`, 'approved')
      .addSelect(`COUNT(*) FILTER (WHERE pa.status = 'rejected')`, 'rejected')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (pa."decidedAt" - pa."createdAt")) / 3600)
         FILTER (WHERE pa."decidedAt" IS NOT NULL)`,
        'avgTurnaroundHours',
      )
      .groupBy('pa.provider')
      .getRawMany();

    return rows.map((r) => {
      const total = parseInt(r.total, 10);
      const approved = parseInt(r.approved, 10);
      const decided = approved + parseInt(r.rejected, 10);
      return {
        provider: r.provider,
        total,
        approved,
        rejected: parseInt(r.rejected, 10),
        approvalRate: decided > 0 ? Math.round((approved / decided) * 1000) / 10 : 0,
        avgTurnaroundHours: r.avgTurnaroundHours
          ? Math.round(parseFloat(r.avgTurnaroundHours) * 10) / 10
          : null,
      };
    });
  }
}
