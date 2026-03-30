import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface SellerPayoutSummary {
  sellerId: number;
  shopName: string;
  unpaidCount: number;
  totalUnpaid: string;
}

export interface SettleResult {
  sellerId: number;
  settledCount: number;
  totalSettled: string;
  referenceNumber: string;
}

/**
 * Manages commission records for seller payouts.
 * Provides admin-level aggregation and settlement with ACID guarantees.
 */
@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all sellers who have unpaid commissions, grouped with totals.
   */
  async getPendingBySeller(): Promise<SellerPayoutSummary[]> {
    const results = await this.prisma.commission.groupBy({
      by: ['sellerId'],
      where: { status: 'Unpaid' },
      _count: { id: true },
      _sum: { commissionAmount: true },
    });

    if (!results.length) return [];

    const sellerIds = results.map((r) => r.sellerId);
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, shopName: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s.shopName]));

    return results.map((r) => ({
      sellerId: r.sellerId,
      shopName: sellerMap.get(r.sellerId) ?? 'Unknown',
      unpaidCount: r._count.id,
      totalUnpaid: (r._sum.commissionAmount ?? new Prisma.Decimal(0)).toString(),
    }));
  }

  /**
   * Atomically settles all unpaid commissions for a seller.
   *
   * ACID guarantees:
   * - Reads unpaid IDs (inside transaction) then updates only those rows.
   * - Prevents double-settlement via status pre-check.
   * - Stores the admin-supplied referenceNumber on every settled record.
   */
  async settleBySeller(
    sellerId: number,
    referenceNumber: string,
  ): Promise<SettleResult> {
    if (!referenceNumber?.trim()) {
      throw new BadRequestException(
        'A reference number is required to settle payouts.',
      );
    }

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });
    if (!seller) throw new NotFoundException('Seller not found.');

    return this.prisma.$transaction(async (tx) => {
      // Fetch only Unpaid commissions inside the transaction for safety
      const unpaid = await tx.commission.findMany({
        where: { sellerId, status: 'Unpaid' },
        select: { id: true, commissionAmount: true },
      });

      if (!unpaid.length) {
        throw new BadRequestException(
          'No unpaid commissions found for this seller.',
        );
      }

      const totalSettled = unpaid.reduce(
        (acc, c) => acc.add(c.commissionAmount),
        new Prisma.Decimal(0),
      );

      // Bulk update all to Paid with reference and timestamp
      await tx.commission.updateMany({
        where: { id: { in: unpaid.map((c) => c.id) } },
        data: {
          status: 'Paid',
          datePaid: new Date(),
          referenceNumber: referenceNumber.trim(),
        },
      });

      return {
        sellerId,
        settledCount: unpaid.length,
        totalSettled: totalSettled.toString(),
        referenceNumber: referenceNumber.trim(),
      };
    });
  }
}
