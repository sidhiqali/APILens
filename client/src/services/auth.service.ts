import { apiClient } from '@/lib/axios';
import {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ApiResponse,
} from '@/types';

class AuthService {
  private baseUrl = '/auth';

  async login(credentials: LoginRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/login`,
      credentials
    );
    
    return {
      success: true,
      data: response.user,
      message: response.message,
      statusCode: 200,
    };
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/register`,
      userData
    );
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/logout`
    );
    return response;
  }

  async validateSession(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<any>(
      `${this.baseUrl}/profile`
    );
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<any>(
      `${this.baseUrl}/profile`
    );
    return response;
  }

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/forgot-password`,
      request
    );
    return response;
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/reset-password`,
      request
    );
    return response;
  }

  async changePassword(
    request: ChangePasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put<any>(
      `${this.baseUrl}/change-password`,
      request
    );
    return response;
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/verify-email`,
      { token }
    );
    return response;
  }

  async resendVerificationEmail(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/resend-verification`
    );
    return response;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<any>(
      `${this.baseUrl}/profile`,
      userData
    );
    return response;
  }

  async uploadProfilePicture(file: File): Promise<ApiResponse<{ profilePicture: string }>> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await apiClient.post<any>(
      `${this.baseUrl}/upload-profile-picture`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  async updateNotificationPreferences(
    preferences: User['notificationPreferences']
  ): Promise<ApiResponse<User>> {
    const response = await apiClient.put<any>(
      `${this.baseUrl}/notification-preferences`,
      preferences
    );
    return response;
  }
}

export const authService = new AuthService();
export default authService;
