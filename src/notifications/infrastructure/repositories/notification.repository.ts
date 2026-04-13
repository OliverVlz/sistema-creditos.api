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
    page: number = 1,
    limit: number = 30,
  ): Promise<Notification[]> {
    let safePage = page;
    if (safePage < 1) {
      safePage = 1;
    }

    let safeLimit = limit;
    if (safeLimit < 1) {
      safeLimit = 30;
    }

    const skip = (safePage - 1) * safeLimit;

    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip,
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

  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId },
    });
  }
}
