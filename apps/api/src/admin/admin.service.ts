import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  findAllUsers(page = 1, limit = DEFAULT_PAGE_SIZE) {
    const safeLimit = Math.min(limit, DEFAULT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    return this.prisma.user.findMany({
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
    });
  }

  async setUserStatus(userId: number, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  async setShopStatus(sellerId: number, status: ShopStatus) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Shop not found.');
    return this.prisma.seller.update({ where: { id: sellerId }, data: { shopStatus: status } });
  }

  async getPlatformStats() {
    const [totalUsers, totalSellers, totalOrders, revenueAgg] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.seller.count(),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { paymentStatus: 'Paid' },
        _sum: { paymentAmount: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.paymentAmount ?? 0);

    return { totalUsers, totalSellers, totalOrders, totalRevenue };
  }
}
