// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from 'src/Schemas/notification.schema';
import { Api } from 'src/Schemas/api.schema';
import { User } from 'src/Schemas/user.schema';
import { ChangeDetail } from 'src/Schemas/api-change.schema';
import { EmailService } from './email.service';
import { NotificationsGateway } from '../../gateways/notifications.gateway';

interface NotificationCreateDto {
  userId: string;
  apiId?: string;
  changeId?: string;
  type: 'api_change' | 'api_error' | 'api_recovered' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
  channels?: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(Api.name) private apiModel: Model<Api>,
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async notifyApiChanges(
    apiId: string,
    changes: ChangeDetail[],
    newVersion?: string,
  ): Promise<void> {
    try {
      const api = await this.apiModel.findById(apiId).populate('userId');
      if (!api) {
        this.logger.error(`API not found: ${apiId}`);
        return;
      }

      const user = await this.userModel.findById(api.userId);
      if (!user) {
        this.logger.error(`User not found for API: ${apiId}`);
        return;
      }

      // Determine severity based on changes
      const severity = this.determineSeverity(changes);
      const isBreaking = changes.some((c) => c.changeType === 'removed');

      // Check user preferences
      if (!this.shouldNotifyUser(user, severity, isBreaking)) {
        this.logger.log(
          `User preferences skip notification for API ${api.apiName}`,
        );
        return;
      }

      const title = this.generateChangeTitle(api.apiName, changes, newVersion);
      const message = this.generateChangeMessage(changes);

      const notificationData: NotificationCreateDto = {
        userId: api.userId.toString(),
        apiId,
        type: 'api_change',
        title,
        message,
        severity,
        metadata: {
          changesCount: changes.length,
          newVersion,
          breakingChanges: isBreaking,
          changes: changes.slice(0, 5), // Limit to first 5 changes
        },
        channels: this.getNotificationChannels(user, severity),
      };

      await this.createAndSendNotification(notificationData);
    } catch (error) {
      this.logger.error(`Failed to notify API changes: ${error.message}`);
    }
  }

  async notifyApiError(apiId: string, errorMessage: string): Promise<void> {
    try {
      const api = await this.apiModel.findById(apiId);
      if (!api) return;

      const user = await this.userModel.findById(api.userId);
      if (!user || !user.notificationPreferences?.apiErrors) {
        return;
      }

      const notificationData: NotificationCreateDto = {
        userId: api.userId.toString(),
        apiId,
        type: 'api_error',
        title: `API Error: ${api.apiName}`,
        message: `Failed to check API: ${errorMessage}`,
        severity: 'high',
        metadata: { error: errorMessage },
        channels: ['in-app', 'email'],
      };

      await this.createAndSendNotification(notificationData);
    } catch (error) {
      this.logger.error(`Failed to notify API error: ${error.message}`);
    }
  }

  async notifyApiRecovered(apiId: string): Promise<void> {
    try {
      const api = await this.apiModel.findById(apiId);
      if (!api) return;

      const user = await this.userModel.findById(api.userId);
      if (!user) return;

      const notificationData: NotificationCreateDto = {
        userId: api.userId.toString(),
        apiId,
        type: 'api_recovered',
        title: `API Recovered: ${api.apiName}`,
        message: `API is now responding normally`,
        severity: 'low',
        metadata: {},
        channels: ['in-app'],
      };

      await this.createAndSendNotification(notificationData);
    } catch (error) {
      this.logger.error(`Failed to notify API recovery: ${error.message}`);
    }
  }

  private async createAndSendNotification(
    data: NotificationCreateDto,
  ): Promise<void> {
    try {
      // Create notification record
      const notification = await this.notificationModel.create({
        userId: new Types.ObjectId(data.userId),
        apiId: data.apiId ? new Types.ObjectId(data.apiId) : undefined,
        changeId: data.changeId ? new Types.ObjectId(data.changeId) : undefined,
        type: data.type,
        title: data.title,
        message: data.message,
        severity: data.severity,
        metadata: data.metadata,
        channels: data.channels || ['in-app'],
        deliveryStatus: (data.channels || ['in-app']).map((channel) => ({
          channel,
          status: 'pending',
        })),
      });

      // Send real-time notification via WebSocket
      this.notificationsGateway.broadcastNotification(data.userId, {
        id: (notification._id as any).toString(),
        userId: data.userId,
        apiId: data.apiId,
        type: data.type,
        title: data.title,
        message: data.message,
        severity: data.severity,
        metadata: data.metadata,
        createdAt: new Date().toISOString(),
      });

      // Send notifications through different channels
      for (const channel of data.channels || ['in-app']) {
        try {
          await this.sendNotificationToChannel(notification, channel, data);
        } catch (error) {
          this.logger.error(
            `Failed to send notification via ${channel}: ${error.message}`,
          );

          // Update delivery status
          await this.updateDeliveryStatus(
            (notification._id as any).toString(),
            channel,
            'failed',
            error.message,
          );
        }
      }

      this.logger.log(`Notification created and sent: ${data.title}`);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
    }
  }

  private async sendNotificationToChannel(
    notification: any,
    channel: string,
    data: NotificationCreateDto,
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmailNotification(notification, data);
        break;

      case 'webhook':
        await this.sendWebhookNotification(notification);
        break;

      case 'in-app':
        // In-app notifications are already stored in database
        await this.updateDeliveryStatus(
          notification._id.toString(),
          channel,
          'sent',
        );
        break;

      default:
        this.logger.warn(`Unknown notification channel: ${channel}`);
    }
  }

  private async sendEmailNotification(
    notification: any,
    data: NotificationCreateDto,
  ): Promise<void> {
    const user = await this.userModel.findById(data.userId);
    if (!user) return;

    this.emailService.sendChangeNotification({
      to: user.email,
      subject: data.title,
      message: data.message,
      severity: data.severity,
      metadata: data.metadata,
    });

    await this.updateDeliveryStatus(
      notification._id.toString(),
      'email',
      'sent',
    );
  }

  private async sendWebhookNotification(notification: any): Promise<void> {
    // Implement webhook sending logic
    // This would send HTTP POST to user's configured webhook URLs
    this.logger.log('Webhook notification sent (implementation needed)');

    await this.updateDeliveryStatus(
      notification._id.toString(),
      'webhook',
      'sent',
    );
  }

  private async updateDeliveryStatus(
    notificationId: string,
    channel: string,
    status: 'pending' | 'sent' | 'failed',
    error?: string,
  ): Promise<void> {
    await this.notificationModel.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          'deliveryStatus.$[elem].status': status,
          'deliveryStatus.$[elem].sentAt': new Date(),
          'deliveryStatus.$[elem].error': error,
        },
      },
      {
        arrayFilters: [{ 'elem.channel': channel }],
      },
    );
  }

  // User-facing methods
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {},
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    const query: any = { userId: new Types.ObjectId(userId) };

    if (options.unreadOnly) {
      query.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .populate('apiId', 'apiName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset),
      this.notificationModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      {
        read: true,
        readAt: new Date(),
      },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
    );
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    const [total, unread, byType, bySeverity] = await Promise.all([
      this.notificationModel.countDocuments({ userId: userObjectId }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
      }),
      this.notificationModel.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.notificationModel.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      unread,
      byType: byType.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      bySeverity: bySeverity.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
    };
  }

  // Helper methods
  private determineSeverity(
    changes: ChangeDetail[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    const hasRemovals = changes.some((c) => c.changeType === 'removed');
    const hasSecurityChanges = changes.some((c) => c.path.includes('security'));

    if (hasRemovals) return 'high';
    if (hasSecurityChanges) return 'medium';
    return 'low';
  }

  private shouldNotifyUser(
    user: any,
    severity: string,
    isBreaking: boolean,
  ): boolean {
    const prefs = user.notificationPreferences || {};

    if (!prefs.email) return false;
    if (isBreaking && !prefs.breakingChanges) return false;
    if (!isBreaking && !prefs.nonBreakingChanges) return false;

    return true;
  }

  private generateChangeTitle(
    apiName: string,
    changes: ChangeDetail[],
    newVersion?: string,
  ): string {
    const changeCount = changes.length;
    const versionText = newVersion ? ` (v${newVersion})` : '';

    return `${apiName} Updated${versionText} - ${changeCount} change${changeCount > 1 ? 's' : ''}`;
  }

  private generateChangeMessage(changes: ChangeDetail[]): string {
    const summary = changes
      .slice(0, 3)
      .map((c) => `• ${c.description}`)
      .join('\n');
    const moreText =
      changes.length > 3 ? `\n...and ${changes.length - 3} more changes` : '';

    return `${summary}${moreText}`;
  }

  private getNotificationChannels(user: any, severity: string): string[] {
    const channels = ['in-app'];

    if (user.notificationPreferences?.email) {
      channels.push('email');
    }

    // Add webhook for high severity
    if (severity === 'high' || severity === 'critical') {
      channels.push('webhook');
    }

    return channels;
  }
}
