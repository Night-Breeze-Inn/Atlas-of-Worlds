// backend/src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
      throw new InternalServerErrorException(
        'JWT_SECRET environment variable is not set. Authentication cannot be configured.',
      );
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    };
    super(options);
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
