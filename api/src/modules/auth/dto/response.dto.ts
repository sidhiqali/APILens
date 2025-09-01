import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IUser } from 'src/types/user.type';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User role', example: 'user' })
  role: string;

  @ApiProperty({ description: 'Email verification status', example: true })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account status', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-11-01T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-12-01T10:30:00.000Z',
  })
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Success message', example: 'Login successful' })
  message: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: IUser;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refreshToken?: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'User registered successfully. Please check your email for verification link.',
  })
  message: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: IUser;
}
