import { apiClient } from '@/lib/axios';
import {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  ApiResponse,
  AuthUser,
} from '@/types';

class AuthService {
  private baseUrl = '/auth';

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthUser>> {
    const response = await apiClient.post<any>(
      `${this.baseUrl}/login`,
      credentials
    );
    // Backend returns { message, user, token, refreshToken } directly
    // Transform to match ApiResponse format
    return {
      success: true,
      data: {
        ...response.user,
        accessToken: response.token,
        refreshToken: response.refreshToken,
      },
      message: response.message,
      statusCode: 200,
    };
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>(
      `${this.baseUrl}/register`,
      userData
    );
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/logout`
    );
    return response;
  }

  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      `${this.baseUrl}/refresh`,
      request
    );
    return response;
  }

  // Password management
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/forgot-password`,
      request
    );
    return response;
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/reset-password`,
      request
    );
    return response;
  }

  async changePassword(
    request: ChangePasswordRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<ApiResponse<void>>(
      `${this.baseUrl}/change-password`,
      request
    );
    return response;
  }

  // Email verification
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/verify-email`,
      { token }
    );
    return response;
  }

  async resendVerificationEmail(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/resend-verification`
    );
    return response;
  }

  // Profile management
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${this.baseUrl}/profile`
    );
    return response;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `${this.baseUrl}/profile`,
      userData
    );
    return response;
  }

  async uploadProfilePicture(
    file: File
  ): Promise<ApiResponse<{ profilePicture: string }>> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await apiClient.post<
      ApiResponse<{ profilePicture: string }>
    >(`${this.baseUrl}/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/account`
    );
    return response;
  }

  // Session management
  async validateSession(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/profile`);
      // Transform profile response to match ApiResponse format
      return {
        success: true,
        data: response.data,
        message: response.message,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Session validation failed',
        statusCode: error.response?.status || 500,
      };
    }
  }

  async terminateAllSessions(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${this.baseUrl}/terminate-sessions`
    );
    return response;
  }
}

export const authService = new AuthService();
export default authService;
