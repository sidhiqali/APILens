import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address to send reset link to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123xyz789',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'verify123token',
  })
  @IsString()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh_token_here',
  })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;
}

export class NotificationPreferencesDto {
  @ApiProperty({
    description: 'Enable email notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  email?: boolean;

  @ApiProperty({
    description: 'Notify on breaking changes',
    example: true,
    required: false,
  })
  @IsOptional()
  breakingChanges?: boolean;

  @ApiProperty({
    description: 'Notify on non-breaking changes',
    example: false,
    required: false,
  })
  @IsOptional()
  nonBreakingChanges?: boolean;

  @ApiProperty({
    description: 'Notify on API errors',
    example: true,
    required: false,
  })
  @IsOptional()
  apiErrors?: boolean;
}
