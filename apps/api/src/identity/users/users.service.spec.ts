import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaService;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const inputId = 7;
      const expectedUser = { id: inputId, firstName: 'Jane' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(expectedUser);

      const actualUser = await service.findById(inputId);

      expect(actualUser).toBe(expectedUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: inputId },
        select: expect.any(Object),
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('delegates to prisma.update with dto and returns projected user', async () => {
      const inputId = 5;
      const inputDto = { firstName: 'Updated', lastName: 'User' };
      const expectedUser = {
        id: inputId,
        firstName: 'Updated',
        lastName: 'User',
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(expectedUser);

      const actualUser = await service.updateProfile(inputId, inputDto as any);

      expect(actualUser).toBe(expectedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: inputId },
        data: inputDto,
        select: expect.any(Object),
      });
    });
  });
});
