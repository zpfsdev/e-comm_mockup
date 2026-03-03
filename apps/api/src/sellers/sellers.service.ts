import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';

const MAX_SHOPS_LIST_SIZE = 200;
const SHOP_PRODUCT_PREVIEW_LIMIT = 24;
const SALES_REPORT_PAGE_SIZE = 100;

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(limit = MAX_SHOPS_LIST_SIZE) {
    return this.prisma.seller.findMany({
      where: { shopStatus: 'Active' },
      select: { id: true, shopName: true, shopLogoUrl: true, shopDescription: true, registeredAt: true },
      orderBy: { shopName: 'asc' },
      take: limit,
    });
  }

  async findById(id: number, productLimit = SHOP_PRODUCT_PREVIEW_LIMIT) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'Available' },
          select: { id: true, name: true, imageUrl: true, price: true, category: true },
          take: productLimit,
          orderBy: { dateAdded: 'desc' },
        },
      },
    });
    if (!seller) throw new NotFoundException('Shop not found.');
    return seller;
  }

  async registerSeller(userId: number, dto: CreateSellerDto) {
    const existingSeller = await this.prisma.seller.findUnique({ where: { userId } });
    if (existingSeller) throw new ConflictException('User already has a seller account.');

    const sellerRole = await this.prisma.role.findUniqueOrThrow({ where: { roleName: RoleName.Seller } });

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.create({
        data: {
          userId,
          shopName: dto.shopName,
          shopDescription: dto.shopDescription,
          shopLogoUrl: dto.shopLogoUrl,
        },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: sellerRole.id } },
        update: {},
        create: { userId, roleId: sellerRole.id },
      });
      return seller;
    });
  }

  async getSellerDashboard(userId: number) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });

    const [products, recentOrders, commissions] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.orderItem.findMany({
        where: { product: { sellerId: seller.id } },
        include: {
          order: { include: { user: { select: { firstName: true, lastName: true } } } },
          product: { select: { name: true } },
        },
        orderBy: { order: { orderDate: 'desc' } },
        take: 10,
      }),
      this.prisma.commission.aggregate({
        where: { sellerId: seller.id },
        _sum: { commissionAmount: true },
      }),
    ]);

    return { seller, stats: { products, totalCommission: commissions._sum.commissionAmount }, recentOrders };
  }

  async getSellerStats(userId: number) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });

    const [totalProducts, totalOrders, pendingOrders, revenueAgg] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.orderItem.count({ where: { product: { sellerId: seller.id } } }),
      this.prisma.orderItem.count({
        where: { product: { sellerId: seller.id }, orderItemStatus: 'Pending' },
      }),
      this.prisma.orderItem.aggregate({
        where: { product: { sellerId: seller.id }, orderItemStatus: 'Completed' },
        _sum: { price: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.price ?? 0);

    return { totalProducts, totalOrders, pendingOrders, totalRevenue };
  }

  async getSalesReport(userId: number, page = 1, limit = SALES_REPORT_PAGE_SIZE) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });
    const safeLimit = Math.min(limit, SALES_REPORT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    return this.prisma.orderItem.findMany({
      where: { product: { sellerId: seller.id }, orderItemStatus: 'Completed' },
      include: { product: { select: { name: true, price: true } }, order: { select: { orderDate: true } } },
      orderBy: { order: { orderDate: 'desc' } },
      take: safeLimit,
      skip,
    });
  }
}
