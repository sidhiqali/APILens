import { apiClient } from '@/lib/axios';

export interface UserProfile {
  _id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  isActive: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  notificationPreferences: NotificationPreferences;
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

export interface UpdateProfileRequest {
  email?: string;
  profilePicture?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiSettings {
  checkFrequency: string;
  isActive: boolean;
  tags: string[];
  description?: string;
  webhookUrl?: string;
  notificationSettings: {
    breakingChanges: boolean;
    nonBreakingChanges: boolean;
    healthIssues: boolean;
  };
}

class SettingsService {
  private baseUrl = '/auth';

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{ user: UserProfile }>(
      `${this.baseUrl}/profile`
    );
    return response.user;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put<{ user: UserProfile }>(
      `${this.baseUrl}/profile`,
      data
    );
    return response.user;
  }

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(
      `${this.baseUrl}/change-password`,
      data
    );
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const profile = await this.getProfile();
    return profile.notificationPreferences;
  }

  async updateNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const response = await apiClient.put<{
      preferences: NotificationPreferences;
    }>(`${this.baseUrl}/notification-preferences`, preferences);
    return response.preferences;
  }

  async getApiSettings(apiId: string): Promise<ApiSettings> {
    return await apiClient.get<ApiSettings>(`/apis/${apiId}/settings`);
  }

  async updateApiSettings(
    apiId: string,
    settings: Partial<ApiSettings>
  ): Promise<ApiSettings> {
    return await apiClient.put<ApiSettings>(
      `/apis/${apiId}/settings`,
      settings
    );
  }

  async getSystemSettings(): Promise<{
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
  }> {
    return {
      theme: (localStorage.getItem('theme') as any) || 'system',
      language: localStorage.getItem('language') || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: localStorage.getItem('dateFormat') || 'MM/dd/yyyy',
    };
  }

  async updateSystemSettings(settings: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: string;
  }): Promise<void> {
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        localStorage.setItem(key, value);
      }
    });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(
      `${this.baseUrl}/account`
    );
  }

  async exportUserData(): Promise<Blob> {
    return await apiClient.get(`${this.baseUrl}/export`, {
      responseType: 'blob',
    });
  }

  async generateApiKey(): Promise<{ apiKey: string }> {
    return await apiClient.post<{ apiKey: string }>(
      `${this.baseUrl}/api-key/generate`
    );
  }

  async revokeApiKey(): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(
      `${this.baseUrl}/api-key`
    );
  }

  async getApiKey(): Promise<{ apiKey: string | null }> {
    return await apiClient.get<{ apiKey: string | null }>(
      `${this.baseUrl}/api-key`
    );
  }
}

export const settingsService = new SettingsService();
