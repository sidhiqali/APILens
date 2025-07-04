import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  AuthResponseDto,
  RegisterResponseDto,
  CreateUserData,
} from './dto/response.dto';
import { UserDocument } from 'src/types/user.type';
import { toSafeUser } from 'utils/user';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(
    email: string,
    password: string,
    role: string = 'user',
  ): Promise<RegisterResponseDto> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: CreateUserData = {
      email,
      password: hashedPassword,
      role,
    };
    const user = await this.userService.create(userData);
    return { message: 'User registered successfully', user: toSafeUser(user) };
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id.toString() };
    const token = this.jwtService.sign(payload);

    return { message: 'Login successful', user: toSafeUser(user), token };
  }
}
