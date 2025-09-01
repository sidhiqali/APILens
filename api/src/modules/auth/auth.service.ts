import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthResponseDto, RegisterResponseDto } from './dto/response.dto';
import { UserDocument } from 'src/types/user.type';
import { toSafeUser } from 'utils/user';
import { EmailService } from '../notifications/email.service';
import {
  ForgotPasswordResponseDto,
  RefreshTokenResponseDto,
  ResetPasswordResponseDto,
  VerifyEmailResponseDto,
} from './dto/auth-responses.dto';
import { CreateUserData } from 'src/types/auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }

  async register(
    email: string,
    password: string,
    role: string = 'user',
  ): Promise<RegisterResponseDto> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationToken = this.generateToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userData: CreateUserData = {
      email,
      password: hashedPassword,
      role,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
    };

    const user = await this.userService.create(userData);

    this.sendVerificationEmail(email, emailVerificationToken);

    return {
      message:
        'User registered successfully. Please check your email for verification link.',
      user: toSafeUser(user),
    };
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    await this.userService.updateLastLogin(user._id.toString());

    const tokens = this.generateTokens(user);

    await this.userService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return {
      message: 'Login successful',
      user: toSafeUser(user),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If an account with that email exists, we have sent a password reset link.',
        email,
      };
    }

    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.userService.setPasswordResetToken(
      user._id.toString(),
      resetToken,
      resetExpires,
    );

    this.sendPasswordResetEmail(email, resetToken);

    return {
      message:
        'If an account with that email exists, we have sent a password reset link.',
      email,
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponseDto> {
    const user = await this.userService.findByPasswordResetToken(token);
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userService.resetPassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    const user = await this.userService.findByEmailVerificationToken(token);
    if (
      !user ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userService.verifyEmail(user._id.toString());

    return { message: 'Email verified successfully' };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const user = await this.userService.findByRefreshToken(refreshToken);
    if (
      !user ||
      !user.refreshTokenExpires ||
      user.refreshTokenExpires < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = this.generateTokens(user);

    await this.userService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return {
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.userService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  private generateTokens(user: UserDocument): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { email: user.email, sub: user._id.toString() };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get('APP_BASE_URL')}/auth/verify-email?token=${token}`;

    this.emailService.sendVerificationEmail({
      to: email,
      subject: 'Verify Your Email - API Lens',
      verificationUrl,
      token,
    });
  }

  private sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    this.emailService.sendPasswordResetEmail({
      to: email,
      subject: 'Reset Your Password - API Lens',
      resetUrl,
      token,
    });
  }
}
