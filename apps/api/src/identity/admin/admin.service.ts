import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaginatedUsersResponseDto {
  readonly users: {
    readonly id: number;
    readonly firstName: string;
    readonly lastName: string;
    readonly username: string;
    readonly email: string;
    readonly contactNumber: string | null;
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

type UserStatus = 'Active' | 'Inactive';
type ShopStatus = 'Active' | 'Inactive' | 'Banned';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedUsersResponseDto> {
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
          contactNumber: true,
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
    return {
      users,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findAllShops(page = 1, limit = DEFAULT_PAGE_SIZE) {
    const safeLimit = Math.min(limit, DEFAULT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const [shops, total] = await Promise.all([
      this.prisma.seller.findMany({
        select: {
          id: true,
          shopName: true,
          shopLogoUrl: true,
          shopDescription: true,
          shopStatus: true,
          registeredAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { registeredAt: 'desc' },
        take: safeLimit,
        skip,
      }),
      this.prisma.seller.count(),
    ]);

    return {
      shops,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  setUserStatus(userId: number, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        ...(status === 'Inactive'
          ? {
              refreshTokenVersion: {
                increment: 1,
              },
            }
          : {}),
      },
      select: { id: true, email: true, username: true, status: true },
    });
  }

  setShopStatus(sellerId: number, status: ShopStatus) {
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { shopStatus: status },
      select: { id: true, shopName: true, shopStatus: true },
    });
  }

  async getPlatformStats() {
    const [totalUsers, totalSellers, totalOrders, totalProducts] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.seller.count(),
        this.prisma.order.count(),
        this.prisma.product.count(),
      ]);

    return { totalUsers, totalSellers, totalOrders, totalProducts };
  }
}
