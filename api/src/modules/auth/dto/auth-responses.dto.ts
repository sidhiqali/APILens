import { ApiProperty } from '@nestjs/swagger';
import { IUser } from 'src/types/user.type';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset email sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Email where reset link was sent',
    example: 'user@example.com',
  })
  email: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset successful',
  })
  message: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully',
  })
  message: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Token refreshed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'New access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Logged out successfully',
  })
  message: string;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'User profile information',
  })
  user: IUser;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message: string;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Notification preferences updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated preferences',
  })
  preferences: {
    email: boolean;
    breakingChanges: boolean;
    nonBreakingChanges: boolean;
    apiErrors: boolean;
  };
}
