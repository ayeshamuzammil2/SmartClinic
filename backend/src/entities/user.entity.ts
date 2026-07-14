import {
  Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/enums';
import { DoctorProfile } from './doctor-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar' })
  role: Role;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @OneToOne(() => DoctorProfile, (p) => p.user)
  doctorProfile?: DoctorProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
