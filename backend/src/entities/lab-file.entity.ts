import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { VisitRecord } from './visit-record.entity';

@Entity('lab_files')
export class LabFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @ManyToOne(() => VisitRecord, (r) => r.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recordId' })
  record: VisitRecord;

  @Column()
  filename: string;

  @Column()
  storedPath: string;

  @Column()
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
