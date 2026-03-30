import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionsService } from './commissions.service';

const mockPrisma = {
  commission: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  seller: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    jest.clearAllMocks();
  });

  // ─── getPendingBySeller ──────────────────────────────────────────────────────

  describe('getPendingBySeller', () => {
    it('returns aggregated unpaid commissions grouped by seller', async () => {
      mockPrisma.commission.groupBy.mockResolvedValue([
        {
          sellerId: 5,
          _count: { id: 3 },
          _sum: { commissionAmount: new Prisma.Decimal('150.00') },
        },
      ]);
      mockPrisma.seller.findMany.mockResolvedValue([
        { id: 5, shopName: 'Art Supplies Co' },
      ]);

      const result = await service.getPendingBySeller();

      expect(result).toEqual([
        {
          sellerId: 5,
          shopName: 'Art Supplies Co',
          unpaidCount: 3,
          totalUnpaid: '150',
        },
      ]);
    });

    it('returns empty array when no unpaid commissions exist', async () => {
      mockPrisma.commission.groupBy.mockResolvedValue([]);

      const result = await service.getPendingBySeller();
      expect(result).toEqual([]);
    });
  });

  // ─── settleBySeller ──────────────────────────────────────────────────────────

  describe('settleBySeller', () => {
    it('settles all unpaid commissions atomically with reference number', async () => {
      mockPrisma.seller.findUnique.mockResolvedValue({ id: 5 });
      mockPrisma.commission.findMany.mockResolvedValue([
        { id: 10, commissionAmount: new Prisma.Decimal('50.00') },
        { id: 11, commissionAmount: new Prisma.Decimal('75.00') },
      ]);
      mockPrisma.commission.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.settleBySeller(5, 'TXN-20260330-001');

      expect(result).toEqual({
        sellerId: 5,
        settledCount: 2,
        totalSettled: '125',
        referenceNumber: 'TXN-20260330-001',
      });
      expect(mockPrisma.commission.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [10, 11] } },
          data: expect.objectContaining({
            status: 'Paid',
            referenceNumber: 'TXN-20260330-001',
          }),
        }),
      );
    });

    it('throws BadRequestException when reference number is empty', async () => {
      await expect(service.settleBySeller(5, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when seller does not exist', async () => {
      mockPrisma.seller.findUnique.mockResolvedValue(null);

      await expect(
        service.settleBySeller(999, 'TXN-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when no unpaid commissions exist', async () => {
      mockPrisma.seller.findUnique.mockResolvedValue({ id: 5 });
      mockPrisma.commission.findMany.mockResolvedValue([]);

      await expect(
        service.settleBySeller(5, 'TXN-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
