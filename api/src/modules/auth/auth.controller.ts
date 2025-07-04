import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RegisterRequestDto, LoginRequestDto } from './dto/request.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto, RegisterResponseDto } from './dto/response.dto';

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
  async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }
}
