import { apiClient } from '@/lib/axios';

export interface Notification {
  _id: string;
  userId: string;
  apiId?: string;
  type:
    | 'api_change'
    | 'api_error'
    | 'api_recovered'
    | 'system'
    | 'breaking_change';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  metadata?: {
    changesCount?: number;
    newVersion?: string;
    breakingChanges?: boolean;
    changes?: any[];
    [key: string]: any;
  };
  channels: string[];
  deliveryStatus: {
    email?: 'pending' | 'sent' | 'failed';
    webhook?: 'pending' | 'sent' | 'failed';
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface NotificationPreferences {
  email: boolean;
  breakingChanges: boolean;
  nonBreakingChanges: boolean;
  apiErrors: boolean;
  webhookUrl?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class NotificationService {
  private baseUrl = '/notifications';

  async getUserNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<PaginatedNotifications> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

    return await apiClient.get<PaginatedNotifications>(
      `${this.baseUrl}?${queryParams.toString()}`
    );
  }

  async getNotificationStats(): Promise<NotificationStats> {
    return await apiClient.get<NotificationStats>(`${this.baseUrl}/stats`);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.put(`${this.baseUrl}/mark-all-read`);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${notificationId}`);
  }

  async getUnreadCount(): Promise<number> {
    const stats = await this.getNotificationStats();
    return stats.unread;
  }

  async updatePreferences(
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    return await apiClient.put<NotificationPreferences>(
      '/auth/notification-preferences',
      preferences
    );
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const profile = await apiClient.get<{
      user: { notificationPreferences: NotificationPreferences };
    }>('/auth/profile');
    return profile.user.notificationPreferences;
  }
}

export const notificationService = new NotificationService();
