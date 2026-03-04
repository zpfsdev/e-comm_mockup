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
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
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
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    const { refreshToken: _refreshToken, ...safeTokens } = tokens;
    void _refreshToken;
    return safeTokens;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  refresh(
    @Req()
    req: Request & {
      cookies?: Record<string, unknown>;
    },
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

    return this.authService.refresh(refreshToken ?? '', csrfToken);
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
}
