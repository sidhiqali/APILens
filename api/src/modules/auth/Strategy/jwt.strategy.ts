import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, ValidatedUser } from 'src/types/jwt.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error(
            'JWT_SECRET environment variable is not set. Please configure it before starting the application.',
          );
        }
        return process.env.JWT_SECRET;
      })(),
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    return { userId: payload.sub, email: payload.email };
  }
}
