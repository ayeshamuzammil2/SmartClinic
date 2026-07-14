import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany,
  OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';
import { LabFile } from './lab-file.entity';

export interface IcdCode {
  code: string;
  description: string;
}

@Entity('visit_records')
export class VisitRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  appointmentId: string;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

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

  @Column({ type: 'text', default: '' })
  subjective: string;

  @Column({ type: 'text', default: '' })
  objective: string;

  @Column({ type: 'text', default: '' })
  assessment: string;

  @Column({ type: 'text', default: '' })
  plan: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  icdCodes: IcdCode[];

  @Column({ default: false })
  finalized: boolean;

  @OneToMany(() => LabFile, (f) => f.record)
  files: LabFile[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
