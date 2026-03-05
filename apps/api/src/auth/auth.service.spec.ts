import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const mockUserRoles = [{ role: { roleName: RoleName.Customer } }];

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
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
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
        roleName: RoleName.Customer,
      });
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const actualResult = await service.register(inputRegisterDto);

      expect(actualResult.accessToken).toBe('mock-token');
      expect(actualResult.user.email).toBe('juan@email.com');
      expect(actualResult.user.roles).toEqual([RoleName.Customer]);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('hashes the password before storing', async () => {
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        roleName: RoleName.Customer,
      });
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await service.register(inputRegisterDto);

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('P@ssw0rd123');
    });

    it('propagates P2002 when email or username is already registered (caught by HttpExceptionFilter in production)', async () => {
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        roleName: RoleName.Customer,
      });
      mockPrisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '',
        }),
      );

      await expect(service.register(inputRegisterDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
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
});
