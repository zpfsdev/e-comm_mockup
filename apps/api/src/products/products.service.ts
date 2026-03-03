import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/** Ensures a request-derived value is a string to prevent type-confusion (e.g. array from repeated query params). */
function ensureString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')
    return value[0];
  throw new BadRequestException('Expected a string value.');
}

/** Ensures a request-derived value is a number to prevent type-confusion (e.g. array from repeated query params). */
function ensureNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (Array.isArray(value) && value.length > 0) {
    const first: unknown = value[0];
    if (typeof first === 'number' && !Number.isNaN(first)) return first;
    const n = Number(first);
    if (!Number.isNaN(n)) return n;
  }
  throw new BadRequestException('Expected a number.');
}

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
    const searchStr = search != null ? ensureString(search) : undefined;

    const where: Prisma.ProductWhereInput = {
      status: 'Available',
      ...(searchStr && {
        OR: [
          { name: { contains: searchStr } },
          { description: { contains: searchStr } },
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

    return {
      products,
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
  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
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
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.findBySeller(seller.id);
  }

  /** Creates a new product — resolves userId → sellerId internally. */
  async createForUser(userId: number, dto: CreateProductDto) {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    const {
      name,
      description,
      imageUrl,
      price,
      categoryId,
      ageRangeId,
      stockQuantity: stockQ,
      height: heightVal,
      weight: weightVal,
      width: widthVal,
      length: lengthVal,
      material: materialVal,
    } = dto;
    const normalized: CreateProductDto = {
      name: ensureString(name),
      description: ensureString(description),
      imageUrl: ensureString(imageUrl),
      price: ensureNumber(price),
      categoryId: ensureNumber(categoryId),
      ageRangeId: ensureNumber(ageRangeId),
      stockQuantity: stockQ !== undefined ? ensureNumber(stockQ) : undefined,
      height: heightVal !== undefined ? ensureNumber(heightVal) : undefined,
      weight: weightVal !== undefined ? ensureNumber(weightVal) : undefined,
      width: widthVal !== undefined ? ensureNumber(widthVal) : undefined,
      length: lengthVal !== undefined ? ensureNumber(lengthVal) : undefined,
      material: materialVal != null ? ensureString(materialVal) : undefined,
    };
    return this.create(seller.id, normalized);
  }

  /**
   * Creates a new product for the given seller.
   * Accepts optional physical dimensions via `productDetail`.
   * Uses explicit field assignment to prevent parameter tampering.
   */
  async create(sellerId: number, dto: CreateProductDto) {
    const { height, weight, width, length, material } = dto;

    return this.prisma.product.create({
      data: {
        name: ensureString(dto.name),
        description: ensureString(dto.description),
        imageUrl: ensureString(dto.imageUrl),
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
                  material:
                    material != null ? ensureString(material) : undefined,
                },
              },
            }
          : {}),
      },
      select: PRODUCT_SELECT,
    });
  }

  /** Updates a product — resolves userId → sellerId internally. */
  async updateForUser(id: number, userId: number, dto: UpdateProductDto) {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    const {
      name: nameVal,
      description: descVal,
      imageUrl: imageUrlVal,
      price: priceVal,
      categoryId: categoryIdVal,
      ageRangeId: ageRangeIdVal,
      stockQuantity: stockQVal,
      height: heightVal,
      weight: weightVal,
      width: widthVal,
      length: lengthVal,
      material: materialVal,
    } = dto;
    const normalized: UpdateProductDto = {
      ...(nameVal !== undefined && { name: ensureString(nameVal) }),
      ...(descVal !== undefined && { description: ensureString(descVal) }),
      ...(imageUrlVal !== undefined && {
        imageUrl: ensureString(imageUrlVal),
      }),
      ...(priceVal !== undefined && { price: ensureNumber(priceVal) }),
      ...(categoryIdVal !== undefined && {
        categoryId: ensureNumber(categoryIdVal),
      }),
      ...(ageRangeIdVal !== undefined && {
        ageRangeId: ensureNumber(ageRangeIdVal),
      }),
      ...(stockQVal !== undefined && {
        stockQuantity: ensureNumber(stockQVal),
      }),
      ...(heightVal !== undefined && { height: ensureNumber(heightVal) }),
      ...(weightVal !== undefined && { weight: ensureNumber(weightVal) }),
      ...(widthVal !== undefined && { width: ensureNumber(widthVal) }),
      ...(lengthVal !== undefined && { length: ensureNumber(lengthVal) }),
      ...(materialVal !== undefined &&
        materialVal !== null && {
          material: ensureString(materialVal),
        }),
    };
    return this.update(id, seller.id, normalized);
  }

  /**
   * Updates a product's fields.
   * Upserts `productDetail` when any dimension value is provided.
   * Throws `ForbiddenException` if the caller does not own the product.
   * Uses explicit field assignment to prevent parameter tampering.
   */
  async update(id: number, sellerId: number, dto: UpdateProductDto) {
    await this.assertOwnership(id, sellerId);
    const { height, weight, width, length, material, price } = dto;

    const data: Prisma.ProductUpdateInput = {
      ...(dto.name !== undefined && { name: ensureString(dto.name) }),
      ...(dto.description !== undefined && {
        description: ensureString(dto.description),
      }),
      ...(dto.imageUrl !== undefined && {
        imageUrl: ensureString(dto.imageUrl),
      }),
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
                  material:
                    material != null ? ensureString(material) : undefined,
                },
                update: {
                  height,
                  weight,
                  width,
                  length,
                  material:
                    material != null ? ensureString(material) : undefined,
                },
              },
            },
          }
        : {}),
    };

    return this.prisma.product.update({
      where: { id },
      data,
      select: PRODUCT_SELECT,
    });
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
  private async assertOwnership(
    productId: number,
    sellerId: number,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.sellerId !== sellerId)
      throw new ForbiddenException('You do not own this product.');
  }
}
