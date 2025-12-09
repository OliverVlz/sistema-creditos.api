import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entity/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(data);
    return this.repository.save(notification);
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.repository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.update({ userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId, isRead: false },
    });
  }
}
