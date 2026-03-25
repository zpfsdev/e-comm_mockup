import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductDetail } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ensureString } from './normalize-product.dto';
import type { ProductDto, ProductListResponseDto } from './models/product.dto';

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
  async findAll(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const {
      search,
      categoryId,
      ageRangeId,
      sellerId,
      sort,
      page = 1,
      limit = 20,
    } = query;
    const safeLimit = Math.min(limit, MAX_PRODUCT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const searchStr = search != null ? ensureString(search) : undefined;

    const where: Prisma.ProductWhereInput = {
      status: 'Available',
      deletedAt: null,
      ...(searchStr && {
        OR: [
          { name: { contains: searchStr } },
          { description: { contains: searchStr } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(ageRangeId && { ageRangeId }),
      ...(sellerId && { sellerId }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'popular'
        ? { orderItems: { _count: 'desc' } }
        : { dateAdded: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: safeLimit,
        select: PRODUCT_SELECT,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => this.mapToProductDto(product)),
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Returns full details for a single product.
   * Throws `NotFoundException` when the product does not exist.
   */
  async findById(id: number): Promise<ProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, status: 'Available', deletedAt: null },
      select: PRODUCT_SELECT,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return this.mapToProductDto(product);
  }

  /** Returns paginated products for a given seller ID, newest first. */
  async findBySeller(
    sellerId: number,
    page = 1,
    limit = 20,
  ): Promise<ProductListResponseDto> {
    const safeLimit = Math.min(limit, MAX_PRODUCT_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const where = { sellerId };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: { dateAdded: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      products: products.map((product) => this.mapToProductDto(product)),
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /** Returns paginated products for the authenticated seller (resolves userId → sellerId). */
  async findByUserId(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<ProductListResponseDto> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.findBySeller(seller.id, page, limit);
  }

  /** Creates a new product — resolves userId → sellerId. Caller must pass controller-normalized DTO. */
  async createForUser(
    userId: number,
    dto: CreateProductDto,
  ): Promise<ProductDto> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.create(seller.id, dto);
  }

  /**
   * Creates a new product for the given seller.
   * Expects controller-normalized DTO (string/number only).
   */
  async create(sellerId: number, dto: CreateProductDto): Promise<ProductDto> {
    const { height, weight, width, length, material } = dto;
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        ageRangeId: dto.ageRangeId,
        stockQuantity: dto.stockQuantity ?? 1,
        sellerId,
        price: new Prisma.Decimal(dto.price),
        ...(height != null ||
        weight != null ||
        width != null ||
        length != null ||
        material != null
          ? {
              productDetail: {
                create: {
                  height,
                  weight,
                  width,
                  length,
                  material: material ?? undefined,
                },
              },
            }
          : {}),
      },
      select: PRODUCT_SELECT,
    });
    return this.mapToProductDto(product);
  }

  /** Updates a product — resolves userId → sellerId. Caller must pass controller-normalized DTO. */
  async updateForUser(
    id: number,
    userId: number,
    dto: UpdateProductDto,
  ): Promise<ProductDto> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.update(id, seller.id, dto);
  }

  /**
   * Updates a product's fields. Expects controller-normalized DTO.
   * Ownership check is folded into the WHERE clause so the read and write are atomic.
   * Upserts productDetail when any dimension is provided.
   */
  async update(
    id: number,
    sellerId: number,
    dto: UpdateProductDto,
  ): Promise<ProductDto> {
    const { height, weight, width, length, material, price } = dto;
    const data: Prisma.ProductUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.ageRangeId !== undefined && { ageRangeId: dto.ageRangeId }),
      ...(dto.stockQuantity !== undefined && {
        stockQuantity: dto.stockQuantity,
      }),
      ...(price !== undefined && { price: new Prisma.Decimal(price) }),
      ...(height != null ||
      weight != null ||
      width != null ||
      length != null ||
      material != null
        ? {
            productDetail: {
              upsert: {
                create: {
                  height,
                  weight,
                  width,
                  length,
                  material: material ?? undefined,
                },
                update: {
                  height,
                  weight,
                  width,
                  length,
                  material: material ?? undefined,
                },
              },
            },
          }
        : {}),
    };
    try {
      const product = await this.prisma.product.update({
        where: { id, sellerId },
        data,
        select: PRODUCT_SELECT,
      });
      return this.mapToProductDto(product);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found.');
      }
      throw err;
    }
  }

  /** Soft-deletes a product — resolves userId → sellerId internally. */
  async removeForUser(id: number, userId: number): Promise<void> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.remove(id, seller.id);
  }

  /**
   * Soft-deletes a product by setting its status to `Unavailable`.
   * Physical record is retained for order history integrity.
   * Ownership check is atomic with the write — sellerId is in the WHERE clause.
   */
  async remove(id: number, sellerId: number): Promise<void> {
    try {
      await this.prisma.product.update({
        where: { id, sellerId },
        data: { status: 'Unavailable', deletedAt: new Date() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found.');
      }
      throw err;
    }
  }

  private mapToProductDto(product: {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: Prisma.Decimal;
    stockQuantity: number;
    status: string;
    dateAdded: Date;
    lastUpdated: Date;
    seller: { id: number; shopName: string; shopLogoUrl: string | null };
    category: { id: number; categoryName: string };
    ageRange: {
      id: number;
      label: string | null;
      minAge: number;
      maxAge: number | null;
    };
    productDetail: ProductDetail | null;
  }): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price.toString(),
      stockQuantity: product.stockQuantity,
      status: product.status,
      dateAdded: product.dateAdded,
      lastUpdated: product.lastUpdated,
      seller: {
        id: product.seller.id,
        shopName: product.seller.shopName,
        shopLogoUrl: product.seller.shopLogoUrl,
      },
      category: {
        id: product.category.id,
        categoryName: product.category.categoryName,
      },
      ageRange: {
        id: product.ageRange.id,
        label: product.ageRange.label,
        minAge: product.ageRange.minAge,
        maxAge: product.ageRange.maxAge,
      },
      productDetail: product.productDetail
        ? {
            height:
              product.productDetail.height != null
                ? Number(product.productDetail.height)
                : null,
            weight:
              product.productDetail.weight != null
                ? Number(product.productDetail.weight)
                : null,
            width:
              product.productDetail.width != null
                ? Number(product.productDetail.width)
                : null,
            length:
              product.productDetail.length != null
                ? Number(product.productDetail.length)
                : null,
            material: product.productDetail.material,
          }
        : null,
    };
  }
}
