import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../core/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** CSRF token for /auth/refresh; client sends it in X-CSRF-Token header. */
  csrfToken: string;
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

const CSRF_TOKEN_PURPOSE = 'csrf';
const CSRF_TOKEN_EXPIRY = '7d';

/** Handles account creation, credential validation, and JWT issuance. */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new Customer account.
   * Throws `ConflictException` if the email or username is already taken.
   * Automatically provisions an empty cart for the new user.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existingUser) {
      throw new ConflictException('Email or username is already in use.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const customerRole = await this.prisma.role.findUniqueOrThrow({
      where: { roleName: RoleName.Customer },
    });

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        dateOfBirth: new Date(dto.dateOfBirth),
        contactNumber: dto.contactNumber,
        userRoles: { create: { roleId: customerRole.id } },
        cart: { create: {} },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return this.buildTokenResponse(user);
  }

  /**
   * Validates credentials and issues a JWT.
   * Throws `UnauthorizedException` for unknown email, wrong password, or inactive account.
   * Updates `lastLogin` timestamp on success.
   */
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === 'Inactive') {
      throw new UnauthorizedException('Account is inactive.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.buildTokenResponse(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshTokenVersion: {
          increment: 1,
        },
      },
    });
  }

  async logoutAll(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenVersion: {
          increment: 1,
        },
      },
    });
  }

  /** Constructs access, refresh, and CSRF tokens and shapes the user summary. */
  private buildTokenResponse(user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    userRoles: { role: { roleName: RoleName } }[];
    refreshTokenVersion: number;
  }): AuthTokens {
    const roles = user.userRoles.map((ur) => ur.role.roleName);
    const payload: JwtPayload = { sub: user.id, email: user.email, roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { ...payload, ver: user.refreshTokenVersion },
      { expiresIn: '7d' },
    );
    const csrfToken = this.jwtService.sign(
      { sub: user.id, purpose: CSRF_TOKEN_PURPOSE },
      { expiresIn: CSRF_TOKEN_EXPIRY },
    );

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  /**
   * Issues a new access token from a valid refresh token.
   * Requires csrfToken to match the user from the refresh token (CSRF protection).
   */
  async refresh(
    refreshToken: string,
    csrfToken: string | undefined,
  ): Promise<{ accessToken: string }> {
    try {
      if (!csrfToken) {
        throw new UnauthorizedException('CSRF token required.');
      }
      const csrfPayload = this.jwtService.verify<{
        sub: number;
        purpose?: string;
      }>(csrfToken);
      if (csrfPayload.purpose !== CSRF_TOKEN_PURPOSE) {
        throw new UnauthorizedException('Invalid CSRF token.');
      }
      const payload = this.jwtService.verify<JwtPayload & { ver?: number }>(
        refreshToken,
      );
      if (payload.sub !== csrfPayload.sub) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { userRoles: { include: { role: true } } },
      });
      if (
        !user ||
        user.status === 'Inactive' ||
        payload.ver !== user.refreshTokenVersion
      ) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      const roles = user.userRoles.map((ur) => ur.role.roleName);
      const newPayload: JwtPayload = { sub: user.id, email: user.email, roles };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      return { accessToken };
    } catch (err) {
      this.logger.debug(err);
      const ex = new UnauthorizedException('Invalid refresh token.');
      if (err instanceof Error) (ex as Error & { cause?: unknown }).cause = err;
      throw ex;
    }
  }
}
