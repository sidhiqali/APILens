import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Res,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterRequestDto, LoginRequestDto } from './dto/request.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateProfileDto,
  NotificationPreferencesDto,
} from './dto/auth-extended.dto';
import { AuthResponseDto, RegisterResponseDto } from './dto/response.dto';
import {
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  VerifyEmailResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
  ProfileResponseDto,
  ChangePasswordResponseDto,
  NotificationPreferencesResponseDto,
} from './dto/auth-responses.dto';

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(dto.email, dto.password, dto.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto.email, dto.password);

    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    return await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    return await this.authService.verifyEmail(dto.token);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshTokenResponseDto> {
    const result = await this.authService.refreshToken(dto.refreshToken);

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    await this.userService.updateRefreshToken(req.user.userId, null, null);

    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req): Promise<ProfileResponseDto> {
    const user = await this.userService.getProfile(req.user.userId);
    return { user };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userService.updateProfile(req.user.userId, dto);
    return { user };
  }
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    return await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Put('notification-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiBody({ type: NotificationPreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    type: NotificationPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateNotificationPreferences(
    @Request() req,
    @Body() dto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return await this.userService.updateNotificationPreferences(
      req.user.userId,
      dto,
    );
  }
}
