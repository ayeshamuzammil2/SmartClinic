import {
  Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

export interface TriageData {
  chiefComplaint: string;
  symptomDurationDays: number;
  severity: number;
  relevantHistory: string;
  currentMedications: string;
  redFlags: string[];
}

@Entity('triage_summaries')
export class TriageSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  appointmentId: string;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  patientId: string;

  @Column({ type: 'jsonb' })
  summary: TriageData;

  @Column({ type: 'varchar', default: 'ai' })
  source: 'ai' | 'manual';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
