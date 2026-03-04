import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SellersService } from './sellers.service';

const mockPrisma = {
  seller: {
    findUniqueOrThrow: jest.fn(),
  },
  product: {
    count: jest.fn(),
  },
  orderItem: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
} as unknown as PrismaService;

describe('SellersService', () => {
  let service: SellersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
    jest.clearAllMocks();
  });

  describe('getSellerStats', () => {
    it('computes aggregate counts and revenue using Prisma aggregate', async () => {
      const inputUserId = 42;
      const mockSeller = { id: 7 };

      (mockPrisma.seller.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        mockSeller,
      );
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.orderItem.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4);
      (mockPrisma.orderItem.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: 250 },
      });

      const actualStats = await service.getSellerStats(inputUserId);

      expect(actualStats).toEqual({
        totalProducts: 3,
        totalOrders: 10,
        pendingOrders: 4,
        totalRevenue: '250',
      });
      expect(mockPrisma.seller.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: inputUserId },
        select: { id: true },
      });
    });

    it('propagates NotFoundException when seller does not exist', async () => {
      const inputUserId = 99;
      (mockPrisma.seller.findUniqueOrThrow as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.getSellerStats(inputUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
