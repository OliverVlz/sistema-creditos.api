import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  @Get()
  async getMyNotifications(@Request() req) {
    const userId = req.user.id;
    const notifications = await this.notificationRepository.findByUserId(userId);
    const unreadCount = await this.notificationRepository.countUnread(userId);
    return { notifications, unreadCount };
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
