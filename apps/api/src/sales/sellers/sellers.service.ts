import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import type {
  PaginatedSalesReportDto,
  PaginatedSellersResponseDto,
  SellerDashboardDto,
  SellerPublicDto,
  SellerSaleItemDto,
  SellerStatsDto,
  SellerSummaryDto,
} from './models/seller.dto';

const MAX_SELLERS_PAGE_SIZE = 50;
const SHOP_PRODUCT_PREVIEW_LIMIT = 24;
const SALES_REPORT_PAGE_SIZE = 100;
const DASHBOARD_CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  readonly data: T;
  readonly expiresAt: number;
}

@Injectable()
export class SellersService {
  private readonly dashboardCache = new Map<
    number,
    CacheEntry<SellerDashboardDto>
  >();
  private readonly statsCache = new Map<number, CacheEntry<SellerStatsDto>>();

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20): Promise<PaginatedSellersResponseDto> {
    const safeLimit = Math.min(limit, MAX_SELLERS_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const where = { shopStatus: 'Active' as const };
    const [sellers, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        select: {
          id: true,
          shopName: true,
          shopLogoUrl: true,
          shopDescription: true,
          registeredAt: true,
        },
        orderBy: { shopName: 'asc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.seller.count({ where }),
    ]);
    return {
      sellers,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findById(
    id: number,
    productLimit = SHOP_PRODUCT_PREVIEW_LIMIT,
  ): Promise<SellerPublicDto> {
    const seller = await this.prisma.seller.findFirst({
      where: { id, shopStatus: 'Active' },
      select: {
        id: true,
        shopName: true,
        shopLogoUrl: true,
        shopDescription: true,
        registeredAt: true,
        products: {
          where: { status: 'Available' },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            category: { select: { categoryName: true } },
            ageRange: { select: { label: true, minAge: true, maxAge: true } },
          },
          take: productLimit,
          orderBy: { dateAdded: 'desc' },
        },
      },
    });

    if (!seller) throw new NotFoundException('Shop not found.');

    return {
      id: seller.id,
      shopName: seller.shopName,
      shopLogoUrl: seller.shopLogoUrl,
      shopDescription: seller.shopDescription,
      registeredAt: seller.registeredAt,
      products: seller.products.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price.toString(),
        category: p.category?.categoryName ?? null,
        ageRange: p.ageRange
          ? {
              label: p.ageRange.label,
              minAge: p.ageRange.minAge,
              maxAge: p.ageRange.maxAge,
            }
          : null,
      })),
    };
  }

  async registerSeller(
    userId: number,
    dto: CreateSellerDto,
  ): Promise<SellerSummaryDto> {
    const existingSeller = await this.prisma.seller.findUnique({
      where: { userId },
    });
    if (existingSeller)
      throw new ConflictException('User already has a seller account.');

    const sellerRole = await this.prisma.role.findUniqueOrThrow({
      where: { roleName: RoleName.Seller },
    });

    const seller = await this.prisma.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: {
          userId,
          shopName: dto.shopName,
          shopDescription: dto.shopDescription,
          shopLogoUrl: dto.shopLogoUrl,
        },
        select: {
          id: true,
          shopName: true,
          shopLogoUrl: true,
          shopDescription: true,
          registeredAt: true,
        },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: sellerRole.id } },
        update: {},
        create: { userId, roleId: sellerRole.id },
      });
      return created;
    });

    return seller;
  }

  async getSellerDashboard(userId: number): Promise<SellerDashboardDto> {
    const cached = this.dashboardCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
      select: { id: true, shopName: true, shopLogoUrl: true },
    });

    const [products, recentOrders, commissionsSum, recentCommissions] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.orderItem.findMany({
        where: { product: { sellerId: seller.id } },
        select: {
          id: true,
          orderItemStatus: true,
          quantity: true,
          price: true,
          order: {
            select: {
              orderDate: true,
              user: { select: { firstName: true, lastName: true, contactNumber: true } },
              userAddress: {
                select: {
                  address: {
                    select: {
                      street: true,
                      barangay: {
                        select: {
                          barangay: true,
                          city: {
                            select: {
                              city: true,
                              postalCode: true,
                              province: {
                                select: {
                                  province: true
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
            },
          },
          product: { select: { name: true, imageUrl: true } },
        },
        orderBy: { order: { orderDate: 'desc' } },
        take: 10,
      }),
      this.prisma.commission.aggregate({
        where: { sellerId: seller.id },
        _sum: { commissionAmount: true },
      }),
      this.prisma.commission.findMany({
        where: { sellerId: seller.id },
        select: {
          id: true,
          commissionAmount: true,
          status: true,
          datePaid: true,
          orderItem: {
            select: {
              orderId: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
        take: 10,
      }),
    ]);

    const result: SellerDashboardDto = {
      shopName: seller.shopName,
      shopLogoUrl: seller.shopLogoUrl,
      stats: {
        products,
        totalCommission: commissionsSum._sum.commissionAmount?.toString() ?? null,
      },
      recentOrders: recentOrders.map((item) => ({
        id: item.id,
        orderItemStatus: item.orderItemStatus,
        quantity: item.quantity,
        price: item.price.toString(),
        productName: item.product.name,
        productImageUrl: item.product.imageUrl,
        customerName: `${item.order.user.firstName} ${item.order.user.lastName}`,
        orderDate: item.order.orderDate,
        dateDelivered: item.orderItemStatus === 'Completed' ? item.order.orderDate : null, // placeholder
        shippingAddress: item.order.userAddress
          ? `${item.order.user.contactNumber} ${item.order.userAddress.address.street} ${item.order.userAddress.address.barangay.barangay}, ${item.order.userAddress.address.barangay.city.city}, ${item.order.userAddress.address.barangay.city.province.province}, ${item.order.userAddress.address.barangay.city.postalCode}`
          : '—',
      })),
      recentCommissions: recentCommissions.map(c => ({
        id: c.id,
        amount: c.commissionAmount.toString(),
        status: c.status,
        datePaid: c.datePaid,
        orderId: c.orderItem.orderId,
        productName: c.orderItem.product.name,
      })),
    };
    this.dashboardCache.set(userId, {
      data: result,
      expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    });
    return result;
  }

  async getSellerStats(userId: number): Promise<SellerStatsDto> {
    const cached = this.statsCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });

    const [totalProducts, totalOrders, pendingOrders, revenueAgg] =
      await Promise.all([
        this.prisma.product.count({ where: { sellerId: seller.id } }),
        this.prisma.orderItem.count({
          where: { product: { sellerId: seller.id } },
        }),
        this.prisma.orderItem.count({
          where: {
            product: { sellerId: seller.id },
            orderItemStatus: 'Pending',
          },
        }),
        this.prisma.orderItem.aggregate({
          where: {
            product: { sellerId: seller.id },
            orderItemStatus: 'Completed',
          },
          _sum: { price: true },
        }),
      ]);

    const stats: SellerStatsDto = {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: (revenueAgg._sum.price ?? 0).toString(),
    };
    this.statsCache.set(userId, {
      data: stats,
      expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    });
    return stats;
  }

  async getSalesReport(
    userId: number,
    page = 1,
    limit = SALES_REPORT_PAGE_SIZE,
  ): Promise<PaginatedSalesReportDto> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });

    const safeLimit = Math.min(limit, SALES_REPORT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const where = {
      product: { sellerId: seller.id },
      orderItemStatus: 'Completed' as const,
    };

    const [rows, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where,
        select: {
          id: true,
          orderItemStatus: true,
          quantity: true,
          price: true,
          product: { select: { name: true, price: true } },
          order: { select: { orderDate: true } },
        },
        orderBy: { order: { orderDate: 'desc' } },
        take: safeLimit,
        skip,
      }),
      this.prisma.orderItem.count({ where }),
    ]);

    const items: SellerSaleItemDto[] = rows.map((row) => ({
      id: row.id,
      orderItemStatus: row.orderItemStatus,
      quantity: row.quantity,
      price: row.price.toString(),
      productName: row.product.name,
      currentProductPrice: row.product.price.toString(),
      orderDate: row.order.orderDate,
    }));

    return {
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
