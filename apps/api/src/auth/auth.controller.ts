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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type JwtPayload,
} from '../core/decorators/current-user.decorator';
import { Public } from '../core/decorators/public.decorator';
import type { AuthTokens } from './auth.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
@Throttle({ auth: {} })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
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
  ): Promise<{ accessToken: string }> {
    const rawCookies: unknown = req.cookies;
    const cookies =
      rawCookies && typeof rawCookies === 'object'
        ? (rawCookies as { refreshToken?: unknown })
        : { refreshToken: undefined };
    const rawRefresh = cookies.refreshToken;
    const headerValue = req.headers['x-csrf-token'];
    const csrfToken =
      typeof headerValue === 'string'
        ? headerValue
        : Array.isArray(headerValue)
          ? headerValue[0]
          : undefined;

    const refreshToken =
      typeof rawRefresh === 'string' ? rawRefresh : undefined;

    const result = await this.authService.refresh(refreshToken ?? '', csrfToken);
    this.setAccessTokenCookie(res, result.accessToken);
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
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
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: isProduction,
      path: '/',
    });
    this.setAccessTokenCookie(res, tokens.accessToken);
  }

  /** Sets the HttpOnly at cookie carrying the short-lived access token for RSC use. */
  private setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie('at', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
