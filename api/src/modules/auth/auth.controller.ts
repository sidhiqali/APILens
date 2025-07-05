import {
  Body,
  Controller,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RegisterRequestDto, LoginRequestDto } from './dto/request.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto, RegisterResponseDto } from './dto/response.dto';
import { Response } from 'express';

@Controller('auth')
// validation pipe to strip unwanted fields
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(dto.email, dto.password, dto.role);
  }

  @Post('login')
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto.email, dto.password);
    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return result;
  }
}
