import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { PreAuthStatus } from '../common/enums';
import { Appointment } from './appointment.entity';

@Entity('pre_auths')
export class PreAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentId: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  provider: string;

  @Column({ type: 'varchar', default: PreAuthStatus.PENDING })
  status: PreAuthStatus;

  @Column()
  diagnosisCode: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
