import {
  Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (u) => u.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  specialty: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'roomId' })
  room?: Room | null;
}
