// src/modules/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getUserNotifications(req.user.userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.notificationsService.getNotificationStats(req.user.userId);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(@Param('id') id: string, @Request() req) {
    await this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id') id: string, @Request() req) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
  }
}
