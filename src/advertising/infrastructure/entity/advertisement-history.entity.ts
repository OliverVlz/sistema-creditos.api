import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Advertisement } from './advertisement.entity';

@Entity('advertisement_history')
export class AdvertisementHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'advertisement_id', type: 'uuid', nullable: true })
  advertisementId?: string;

  @ManyToOne(() => Advertisement, advertisement => advertisement.history, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement?: Advertisement;

  @Column({ length: 40 })
  action: string;

  @Column({ length: 120 })
  title: string;

  imageUrl: string;

  @Column({ name: 'image_key' })
  imageKey: string;

  @Column({ name: 'target_url', nullable: true })
  targetUrl?: string;

  @Column({ name: 'is_redirect_enabled', default: false })
  isRedirectEnabled: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt?: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
