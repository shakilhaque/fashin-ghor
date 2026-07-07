import {
  Controller, Get, Patch, Delete, Param, Query, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.service.list(user.id, page, Math.min(limit, 50));
    return {
      message: 'Notifications fetched',
      data: { notifications: result.notifications },
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.service.unreadCount(user.id);
    return { message: 'Unread count', data: { count } };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    await this.service.markAllRead(user.id);
    return { message: 'All notifications marked as read', data: null };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.service.markRead(id, user.id);
    return { message: 'Notification marked as read', data: null };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.service.delete(id, user.id);
    return { message: 'Notification deleted', data: null };
  }
}
