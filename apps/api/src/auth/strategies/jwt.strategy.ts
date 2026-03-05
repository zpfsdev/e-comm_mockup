import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../core/decorators/current-user.decorator';

/**
 * Validates the JWT access token on every authenticated request.
 *
 * The DB lookup (user.status check) has been intentionally removed.
 * Rationale: access tokens are short-lived (15 min). Revocation at the
 * refresh boundary is handled by incrementing refreshTokenVersion on
 * logout/ban, which invalidates any subsequent /auth/refresh call.
 * Removing the per-request DB round-trip eliminates a latency and
 * scalability bottleneck with no meaningful security regression.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
