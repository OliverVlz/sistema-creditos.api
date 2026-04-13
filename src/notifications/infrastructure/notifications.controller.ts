import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @Get()
  async getMyNotifications(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '30',
  ) {
    const userId = req.user.id;
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    let currentPage = parsedPage;
    if (Number.isNaN(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    let currentLimit = parsedLimit;
    if (Number.isNaN(currentLimit) || currentLimit < 1) {
      currentLimit = 30;
    }

    const notifications = await this.notificationRepository.findByUserId(
      userId,
      currentPage,
      currentLimit,
    );
    const unreadCount = await this.notificationRepository.countUnread(userId);
    const total = await this.notificationRepository.countByUserId(userId);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    await this.notificationRepository.markAllAsRead(userId);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    await this.notificationRepository.markAsRead(id, userId);
    return { success: true };
  }
}
