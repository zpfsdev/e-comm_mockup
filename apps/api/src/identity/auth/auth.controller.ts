import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type JwtPayload,
} from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import type { UserProfileDto } from '../users/users.service';
import { UsersService } from '../users/users.service';
import type { AuthTokens } from './auth.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ auth: {} })
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthTokens, 'refreshToken'>> {
    const tokens = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    const { refreshToken: _refreshToken, ...safeTokens } = tokens;
    void _refreshToken;
    return safeTokens;
  }

  @Post('login')
  @Public()
  @Throttle({ auth: {} })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthTokens, 'refreshToken'>> {
    const tokens = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    const { refreshToken: _refreshToken, ...safeTokens } = tokens;
    void _refreshToken;
    return safeTokens;
  }

  /**
   * Issues a new access token using the HTTP-only `refreshToken` cookie.
   *
   * **Cookie-only mechanism** — there is no body payload for this endpoint.
   * The browser automatically sends the `refreshToken` cookie (set on login/register)
   * because `withCredentials: true` is used on the client.
   *
   * **CSRF protection** — the caller must include the CSRF token received at login
   * in the `X-CSRF-Token` request header.  Without it the request is rejected with 401.
   *
   * @returns `{ accessToken }` — a fresh 15-minute JWT access token.
   */
  @Post('refresh')
  @Public()
  @Throttle({ auth: {} })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Cookie-only flow: reads `refreshToken` from HttpOnly cookie. ' +
      'Requires the CSRF token (received at login) in the `X-CSRF-Token` header.',
  })
  async refresh(
    @Req()
    req: Request & {
      cookies?: Record<string, unknown>;
    },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    accessToken: string;
    user: {
      id: number;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      roles: string[];
      hasStore?: boolean;
      seller?: { shopName: string };
      profilePictureUrl?: string;
    };
  }> {
    const rawCookies: unknown = req.cookies;
    const cookies =
      rawCookies && typeof rawCookies === 'object'
        ? (rawCookies as { refreshToken?: unknown })
        : { refreshToken: undefined };
    const refreshToken =
      typeof cookies.refreshToken === 'string' ? cookies.refreshToken : undefined;
    const clientCsrfToken = req.headers['x-csrf-token'] as string | undefined;

    if (!refreshToken) throw new UnauthorizedException('No refresh token provided.');
    if (!clientCsrfToken) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('No CSRF token provided.');
    }

    try {
      // Validate CSRF
      await this.jwtService.verifyAsync(clientCsrfToken, {
        secret: this.configService.get<string>('CSRF_SECRET', 'secret'),
      });

      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET', 'secret'),
      });

      const tokenData = await this.authService.refresh(payload, refreshToken);
      if (!tokenData) {
        this.clearAuthCookies(res);
        throw new UnauthorizedException('Invalid refresh token.');
      }
      this.setAuthCookies(res, tokenData.tokens);
      return { accessToken: tokenData.tokens.accessToken, user: tokenData.user };
    } catch (e) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  getMe(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    return this.usersService.findById(user.sub);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change own password and revoke all existing refresh tokens',
  })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.sub, dto);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout: clear auth cookies server-side' })
  async logout(
    @CurrentUser() user: JwtPayload | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (user) {
      await this.authService.logoutAll(user.sub);
    }
    this.clearAuthCookies(res);
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout from all sessions by revoking all existing refresh tokens',
  })
  async logoutAll(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logoutAll(user.sub);
  }

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Smoke test endpoint' })
  test(): { status: string } {
    return { status: 'auth module ok' };
  }

  /** Sets both the HttpOnly refresh-token cookie and the HttpOnly at (access-token) cookie. */
  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: isProduction,
      path: '/api/v1/auth', // using /api/v1/auth instead of /refresh so logout can clear it
    });
    this.setAccessTokenCookie(res, tokens.accessToken);
  }

  /** Sets the HttpOnly at cookie carrying the short-lived access token for RSC use. */
  private setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('at', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      secure: isProduction,
      path: '/',
    });
  }


  /** Clears auth cookies on logout. */
  private clearAuthCookies(res: Response): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const shared = {
      httpOnly: true,
      maxAge: 0,
      secure: isProduction,
    };
    res.cookie('at', '', { ...shared, sameSite: 'lax', path: '/' });
    res.cookie('refreshToken', '', { ...shared, sameSite: 'lax', path: '/api/v1/auth/refresh' }); // Try clear old path
    res.cookie('refreshToken', '', { ...shared, sameSite: 'lax', path: '/api/v1/auth' }); // Try clear new path
  }

}
