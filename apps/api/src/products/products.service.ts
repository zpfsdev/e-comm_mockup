import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  price: true,
  stockQuantity: true,
  status: true,
  dateAdded: true,
  lastUpdated: true,
  seller: { select: { id: true, shopName: true, shopLogoUrl: true } },
  category: { select: { id: true, categoryName: true } },
  ageRange: { select: { id: true, label: true, minAge: true, maxAge: true } },
  productDetail: true,
} as const;

const SELLER_PRODUCT_PREVIEW_LIMIT = 50;
const MAX_PRODUCT_PAGE_SIZE = 50;

/** Manages product listings — browsing, creation, updates, and soft-deletion. */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a paginated list of available products.
   * Supports free-text search across name and description,
   * plus optional filtering by category and age range.
   */
  async findAll(query: ProductQueryDto) {
    const { search, categoryId, ageRangeId, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(limit, MAX_PRODUCT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.ProductWhereInput = {
      status: 'Available',
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(ageRangeId && { ageRangeId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: safeLimit,
        select: PRODUCT_SELECT,
        orderBy: { dateAdded: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  /**
   * Returns full details for a single product.
   * Throws `NotFoundException` when the product does not exist.
   */
  async findById(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: PRODUCT_SELECT });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  /** Returns all products for a given seller ID, newest first. */
  async findBySeller(sellerId: number, limit = SELLER_PRODUCT_PREVIEW_LIMIT) {
    return this.prisma.product.findMany({
      where: { sellerId },
      select: PRODUCT_SELECT,
      orderBy: { dateAdded: 'desc' },
      take: limit,
    });
  }

  /** Returns all products for the authenticated seller (resolves userId → sellerId). */
  async findByUserId(userId: number) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });
    return this.findBySeller(seller.id);
  }

  /** Creates a new product — resolves userId → sellerId internally. */
  async createForUser(userId: number, dto: CreateProductDto) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });
    return this.create(seller.id, dto);
  }

  /**
   * Creates a new product for the given seller.
   * Accepts optional physical dimensions via `productDetail`.
   */
  async create(sellerId: number, dto: CreateProductDto) {
    const { height, weight, width, length, material, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        sellerId,
        price: new Prisma.Decimal(dto.price),
        ...(height || weight || width || length || material
          ? { productDetail: { create: { height, weight, width, length, material } } }
          : {}),
      },
      select: PRODUCT_SELECT,
    });
  }

  /** Updates a product — resolves userId → sellerId internally. */
  async updateForUser(id: number, userId: number, dto: UpdateProductDto) {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });
    return this.update(id, seller.id, dto);
  }

  /**
   * Updates a product's fields.
   * Upserts `productDetail` when any dimension value is provided.
   * Throws `ForbiddenException` if the caller does not own the product.
   */
  async update(id: number, sellerId: number, dto: UpdateProductDto) {
    await this.assertOwnership(id, sellerId);
    const { height, weight, width, length, material, price, ...rest } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(height || weight || width || length || material
          ? {
              productDetail: {
                upsert: {
                  create: { height, weight, width, length, material },
                  update: { height, weight, width, length, material },
                },
              },
            }
          : {}),
      },
      select: PRODUCT_SELECT,
    });
  }

  /** Soft-deletes a product — resolves userId → sellerId internally. */
  async removeForUser(id: number, userId: number): Promise<void> {
    const seller = await this.prisma.seller.findUniqueOrThrow({ where: { userId } });
    return this.remove(id, seller.id);
  }

  /**
   * Soft-deletes a product by setting its status to `Unavailable`.
   * Physical record is retained for order history integrity.
   * Throws `ForbiddenException` if the caller does not own the product.
   */
  async remove(id: number, sellerId: number): Promise<void> {
    await this.assertOwnership(id, sellerId);
    await this.prisma.product.update({
      where: { id },
      data: { status: 'Unavailable' },
    });
  }

  /** Guards mutation endpoints — ensures the product belongs to the seller. */
  private async assertOwnership(productId: number, sellerId: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.sellerId !== sellerId) throw new ForbiddenException('You do not own this product.');
  }
}
