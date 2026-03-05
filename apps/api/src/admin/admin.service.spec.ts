import { Test, TestingModule } from '@nestjs/testing';
import { ShopStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

const mockPrisma = {
  user: {
    count: jest.fn(),
    update: jest.fn(),
  },
  seller: {
    count: jest.fn(),
    update: jest.fn(),
  },
  order: {
    count: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
  },
} as unknown as PrismaService;

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('getPlatformStats', () => {
    it('returns aggregate platform statistics with numeric revenue', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.seller.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(8);
      (mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { paymentAmount: 1234.56 },
      });

      const actualStats = await service.getPlatformStats();

      expect(actualStats).toEqual({
        totalUsers: 5,
        totalSellers: 2,
        totalOrders: 8,
        totalRevenue: 1234.56,
      });
    });

    it('treats missing revenue aggregate as zero', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.seller.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { paymentAmount: null },
      });

      const actualStats = await service.getPlatformStats();

      expect(actualStats.totalRevenue).toBe(0);
    });
  });

  describe('setUserStatus', () => {
    it('updates status without a pre-read when user exists', async () => {
      const inputUserId = 10;
      const inputStatus = UserStatus.Inactive;

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: inputUserId,
        status: inputStatus,
      });

      const actualUser = await service.setUserStatus(inputUserId, inputStatus);

      expect(actualUser.status).toBe(inputStatus);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: inputUserId },
        data: { status: inputStatus },
      });
    });

    it('propagates Prisma P2025 when user does not exist', async () => {
      const p2025 = Object.assign(new Error('Record not found'), { code: 'P2025' });
      (mockPrisma.user.update as jest.Mock).mockRejectedValue(p2025);

      await expect(
        service.setUserStatus(999, UserStatus.Active),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });

  describe('setShopStatus', () => {
    it('updates shop status without a pre-read when seller exists', async () => {
      const inputSellerId = 3;
      const inputStatus = ShopStatus.Active;

      (mockPrisma.seller.update as jest.Mock).mockResolvedValue({
        id: inputSellerId,
        shopStatus: inputStatus,
      });

      const actualSeller = await service.setShopStatus(
        inputSellerId,
        inputStatus,
      );

      expect(actualSeller.shopStatus).toBe(inputStatus);
      expect(mockPrisma.seller.update).toHaveBeenCalledWith({
        where: { id: inputSellerId },
        data: { shopStatus: inputStatus },
      });
    });

    it('propagates Prisma P2025 when seller does not exist', async () => {
      const p2025 = Object.assign(new Error('Record not found'), { code: 'P2025' });
      (mockPrisma.seller.update as jest.Mock).mockRejectedValue(p2025);

      await expect(
        service.setShopStatus(999, ShopStatus.Inactive),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });
});
