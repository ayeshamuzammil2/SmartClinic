import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
