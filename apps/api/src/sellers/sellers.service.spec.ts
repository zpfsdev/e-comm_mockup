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
    findMany: jest.fn(),
  },
  commission: {
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

  describe('getSellerDashboard', () => {
    it('builds dashboard data and caches it per user', async () => {
      const inputUserId = 7;
      const seller = { id: 3, shopName: 'ToyWorld', shopLogoUrl: 'logo.png' };
      const mockRecentOrders = [
        {
          id: 1,
          orderItemStatus: 'Completed',
          quantity: 2,
          price: { toString: () => '199.00' },
          product: { name: 'Blocks' },
          order: {
            orderDate: new Date('2026-01-01T10:00:00Z'),
            user: { firstName: 'Alice', lastName: 'Smith' },
          },
        },
      ];

      (mockPrisma.seller.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        seller,
      );
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.orderItem.findMany as jest.Mock).mockResolvedValue(
        mockRecentOrders,
      );
      (mockPrisma.commission.aggregate as jest.Mock).mockResolvedValue({
        _sum: { commissionAmount: { toString: () => '1234.56' } },
      });

      const first = await service.getSellerDashboard(inputUserId);
      const second = await service.getSellerDashboard(inputUserId);

      expect(first).toEqual({
        shopName: 'ToyWorld',
        shopLogoUrl: 'logo.png',
        stats: {
          products: 5,
          totalCommission: '1234.56',
        },
        recentOrders: [
          {
            id: 1,
            orderItemStatus: 'Completed',
            quantity: 2,
            price: '199.00',
            productName: 'Blocks',
            customerName: 'Alice Smith',
            orderDate: new Date('2026-01-01T10:00:00Z'),
          },
        ],
      });
      expect(second).toBe(first);
      expect(mockPrisma.seller.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.orderItem.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.commission.aggregate).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSalesReport', () => {
    it('returns paginated completed order items for the seller', async () => {
      const inputUserId = 9;
      const seller = { id: 4 };
      const row = {
        id: 10,
        orderItemStatus: 'Completed',
        quantity: 3,
        price: { toString: () => '299.00' },
        product: { name: 'Puzzle', price: { toString: () => '349.00' } },
        order: { orderDate: new Date('2026-01-02T12:00:00Z') },
      };

      (mockPrisma.seller.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        seller,
      );
      (mockPrisma.orderItem.findMany as jest.Mock).mockResolvedValue([row]);
      (mockPrisma.orderItem.count as jest.Mock).mockResolvedValue(1);

      const actualReport = await service.getSalesReport(inputUserId, 1, 50);

      expect(actualReport).toEqual({
        items: [
          {
            id: 10,
            orderItemStatus: 'Completed',
            quantity: 3,
            price: '299.00',
            productName: 'Puzzle',
            currentProductPrice: '349.00',
            orderDate: new Date('2026-01-02T12:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
      expect(mockPrisma.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            product: { sellerId: seller.id },
            orderItemStatus: 'Completed',
          },
          take: 50,
          skip: 0,
        }),
      );
    });
  });
});
