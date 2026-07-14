import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, PreAuth } from '../entities';
import { PreAuthStatus } from '../common/enums';
import { CreatePreAuthDto, UpdatePreAuthStatusDto } from './dto';

const TRANSITIONS: Record<PreAuthStatus, PreAuthStatus[]> = {
  [PreAuthStatus.PENDING]: [PreAuthStatus.SUBMITTED],
  [PreAuthStatus.SUBMITTED]: [PreAuthStatus.APPROVED, PreAuthStatus.REJECTED],
  [PreAuthStatus.APPROVED]: [],
  [PreAuthStatus.REJECTED]: [],
};

@Injectable()
export class PreAuthService {
  constructor(
    @InjectRepository(PreAuth) private preauths: Repository<PreAuth>,
    @InjectRepository(Appointment) private appointments: Repository<Appointment>,
  ) {}

  async create(dto: CreatePreAuthDto) {
    const appt = await this.appointments.findOne({
      where: { id: dto.appointmentId },
      relations: { doctor: { doctorProfile: true } },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.doctor?.doctorProfile?.specialty === 'General Practice') {
      throw new BadRequestException('Pre-authorisation is only required for specialist visits');
    }
    return this.preauths.save(
      this.preauths.create({
        appointmentId: dto.appointmentId,
        provider: dto.provider,
        diagnosisCode: dto.diagnosisCode,
        notes: dto.notes ?? null,
        status: PreAuthStatus.PENDING,
      }),
    );
  }

  async list(status?: PreAuthStatus) {
    return this.preauths.find({
      where: status ? { status } : {},
      relations: {
        appointment: { patient: true, doctor: { doctorProfile: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, dto: UpdatePreAuthStatusDto) {
    const row = await this.preauths.findOneBy({ id });
    if (!row) throw new NotFoundException('Pre-auth request not found');
    if (!TRANSITIONS[row.status].includes(dto.status)) {
      throw new BadRequestException(
        `Invalid transition ${row.status} → ${dto.status} (flow: pending → submitted → approved/rejected)`,
      );
    }
    row.status = dto.status;
    if (dto.status === PreAuthStatus.SUBMITTED) row.submittedAt = new Date();
    if ([PreAuthStatus.APPROVED, PreAuthStatus.REJECTED].includes(dto.status)) {
      row.decidedAt = new Date();
    }
    return this.preauths.save(row);
  }
}
