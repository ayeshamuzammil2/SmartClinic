import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from '../common/enums';
import { User } from './user.entity';

@Entity('appointments')
@Index(['doctorId', 'startTime'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column()
  doctorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'varchar', default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ default: false })
  reminded24h: boolean;

  @Column({ default: false })
  reminded1h: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
