import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, ValidatedUser } from 'src/types/jwt.type';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is not set. Please configure it before starting the application.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          const cookies = request.cookies as Record<string, string> | undefined;
          return cookies?.access_token || null;
        },
      ]),
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    // Simple explicit return with proper typing
    const validatedUser: ValidatedUser = {
      userId: payload.sub,
      email: payload.email,
    };
    return validatedUser;
  }
}
