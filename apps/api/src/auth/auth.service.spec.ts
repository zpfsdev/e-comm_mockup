import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const mockUserRoles = [{ role: { roleName: 'Customer' } }];

const mockUser = {
  id: 1,
  email: 'juan@email.com',
  username: 'juandc',
  firstName: 'Juan',
  lastName: 'dela Cruz',
  password: 'hashed',
  status: 'Active',
  userRoles: mockUserRoles,
};

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findUniqueOrThrow: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
      CSRF_SECRET: 'test-csrf-secret',
    };
    if (!(key in values)) {
      throw new Error(`Config key "${key}" not found in test mock`);
    }
    return values[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    const inputRegisterDto = {
      firstName: 'Juan',
      lastName: 'dela Cruz',
      username: 'juandc',
      email: 'juan@email.com',
      password: 'P@ssw0rd123',
      dateOfBirth: '1995-05-15',
      contactNumber: '09171234567',
    };

    it('creates user and returns access token when email and username are unique', async () => {
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        roleName: 'Customer',
      });
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const actualResult = await service.register(inputRegisterDto);

      expect(actualResult.accessToken).toBe('mock-token');
      expect(actualResult.user.email).toBe('juan@email.com');
      expect(actualResult.user.roles).toEqual(['Customer']);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('hashes the password before storing', async () => {
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        roleName: 'Customer',
      });
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await service.register(inputRegisterDto);

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('P@ssw0rd123');
    });

    it('propagates P2002 when email or username is already registered (caught by HttpExceptionFilter in production)', async () => {
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        roleName: 'Customer',
      });
      mockPrisma.user.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        }),
      );

      await expect(service.register(inputRegisterDto)).rejects.toThrow();
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    const inputLoginDto = { email: 'juan@email.com', password: 'P@ssw0rd123' };

    it('returns access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('P@ssw0rd123', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const actualResult = await service.login(inputLoginDto);

      expect(actualResult.accessToken).toBe('mock-token');
      expect(actualResult.user.email).toBe('juan@email.com');
    });

    it('throws UnauthorizedException when email is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(inputLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(service.login(inputLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when account is inactive', async () => {
      const hashedPassword = await bcrypt.hash('P@ssw0rd123', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        status: 'Inactive',
      });

      await expect(service.login(inputLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('updates lastLogin on successful login', async () => {
      const hashedPassword = await bcrypt.hash('P@ssw0rd123', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.login(inputLoginDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lastLogin: expect.any(Date) }),
        }),
      );
    });
  });

  // ─── changePassword / logoutAll / refresh ────────────────────────────────────

  describe('changePassword', () => {
    it('changes password and bumps refreshTokenVersion when current password is valid', async () => {
      const userId = 1;
      const currentPassword = 'old-pass';
      const newPassword = 'new-pass';
      const hashed = await bcrypt.hash(currentPassword, 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        password: hashed,
      });
      mockPrisma.user.update.mockResolvedValue({});

      await service.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          password: expect.any(String),
          refreshTokenVersion: { increment: 1 },
        },
      });
    });

    it('throws when current password is invalid', async () => {
      const userId = 1;
      const hashed = await bcrypt.hash('different-pass', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        password: hashed,
      });

      await expect(
        service.changePassword(userId, {
          currentPassword: 'wrong',
          newPassword: 'new-pass',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logoutAll', () => {
    it('increments refreshTokenVersion to revoke all refresh tokens', async () => {
      const userId = 1;
      mockPrisma.user.update.mockResolvedValue({});

      await service.logoutAll(userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          refreshTokenVersion: { increment: 1 },
        },
      });
    });
  });

  describe('refresh', () => {
    it('returns new access token when CSRF and refresh token are valid and user active', async () => {
      const csrfToken = 'csrf-token';
      const refreshToken = 'refresh-token';
      mockJwt.verify
        .mockImplementationOnce(() => ({
          sub: 1,
          purpose: 'csrf',
        }))
        .mockImplementationOnce(() => ({
          sub: 1,
          email: mockUser.email,
          ver: 2,
        }));
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenVersion: 2,
        userRoles: mockUserRoles,
      });

      const result = await service.refresh(refreshToken, csrfToken);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toEqual(['Customer']);
    });

    it('throws when CSRF token is missing', async () => {
      await expect(
        service.refresh('any-refresh-token', undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user is inactive', async () => {
      mockJwt.verify
        .mockImplementationOnce(() => ({
          sub: 1,
          purpose: 'csrf',
        }))
        .mockImplementationOnce(() => ({
          sub: 1,
          email: mockUser.email,
          ver: 1,
        }));
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'Inactive',
        refreshTokenVersion: 1,
        userRoles: mockUserRoles,
      });

      await expect(
        service.refresh('refresh-token', 'csrf-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when refresh token version does not match user.refreshTokenVersion', async () => {
      mockJwt.verify
        .mockImplementationOnce(() => ({
          sub: 1,
          purpose: 'csrf',
        }))
        .mockImplementationOnce(() => ({
          sub: 1,
          email: mockUser.email,
          ver: 1,
        }));
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'Active',
        refreshTokenVersion: 2,
        userRoles: mockUserRoles,
      });

      await expect(
        service.refresh('refresh-token', 'csrf-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
