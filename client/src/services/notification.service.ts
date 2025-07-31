import { apiClient } from '@/lib/axios';
import { Notification, ApiResponse, PaginatedResponse } from '@/types';

class NotificationService {
  private baseUrl = '/notifications';

  // Get user notifications
  async getNotifications(
    page = 1,
    limit = 10,
    isRead?: boolean
  ): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (typeof isRead === 'boolean') {
      params.append('isRead', isRead.toString());
    }

    const response = await apiClient.get<PaginatedResponse<Notification>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response;
  }

  // Get notification by ID
  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.get<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}/read`
    );
    return response;
  }

  // Mark notification as unread
  async markAsUnread(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}/unread`
    );
    return response;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
    const response = await apiClient.patch<ApiResponse<any>>(
      `${this.baseUrl}/mark-all-read`
    );
    return response;
  }

  // Delete notification
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<ApiResponse<{ deleted: number }>> {
    const response = await apiClient.delete<ApiResponse<any>>(
      `${this.baseUrl}/all`
    );
    return response;
  }

  // Get notification count
  async getNotificationCount(): Promise<
    ApiResponse<{
      total: number;
      unread: number;
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/count`
    );
    return response;
  }

  // Create notification (admin only)
  async createNotification(notificationData: {
    userId: string;
    apiId?: string;
    type: 'email' | 'webhook' | 'sms';
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<Notification>> {
    const response = await apiClient.post<ApiResponse<Notification>>(
      this.baseUrl,
      notificationData
    );
    return response;
  }

  // Notification preferences
  async getNotificationPreferences(): Promise<
    ApiResponse<{
      email: boolean;
      webhook: boolean;
      sms: boolean;
      types: {
        apiChanges: boolean;
        statusUpdates: boolean;
        securityAlerts: boolean;
        maintenanceNotices: boolean;
      };
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/preferences`
    );
    return response;
  }

  async updateNotificationPreferences(preferences: {
    email?: boolean;
    webhook?: boolean;
    sms?: boolean;
    types?: {
      apiChanges?: boolean;
      statusUpdates?: boolean;
      securityAlerts?: boolean;
      maintenanceNotices?: boolean;
    };
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.patch<ApiResponse<any>>(
      `${this.baseUrl}/preferences`,
      preferences
    );
    return response;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
