import { Injectable } from '@nestjs/common';
import { ShopStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PaginatedUsersResponseDto {
  readonly users: {
    readonly id: number;
    readonly firstName: string;
    readonly lastName: string;
    readonly username: string;
    readonly email: string;
    readonly status: string;
    readonly dateTimeRegistered: Date;
    readonly lastLogin: Date | null;
    readonly userRoles: { role: { roleName: string } }[];
  }[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedUsersResponseDto> {
    const safeLimit = Math.min(limit, DEFAULT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          status: true,
          dateTimeRegistered: true,
          lastLogin: true,
          userRoles: { include: { role: true } },
        },
        orderBy: { dateTimeRegistered: 'desc' },
        take: safeLimit,
        skip,
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  async setUserStatus(userId: number, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, username: true, status: true },
    });
  }

  async setShopStatus(sellerId: number, status: ShopStatus) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { shopStatus: status },
      select: { id: true, shopName: true, shopStatus: true },
    });
  }

  async getPlatformStats() {
    const [totalUsers, totalSellers, totalOrders, revenueAgg] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.seller.count(),
        this.prisma.order.count(),
        this.prisma.payment.aggregate({
          where: { paymentStatus: 'Paid' },
          _sum: { paymentAmount: true },
        }),
      ]);

    const totalRevenue = (revenueAgg._sum.paymentAmount ?? 0).toString();

    return { totalUsers, totalSellers, totalOrders, totalRevenue };
  }
}
