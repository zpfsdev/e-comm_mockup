import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

const mockProduct = {
  id: 1,
  name: 'ABC Flash Cards',
  description: 'Learn the alphabet',
  imageUrl: null,
  price: '199.00',
  stockQuantity: 50,
  status: 'Available',
  dateAdded: new Date(),
  lastUpdated: new Date(),
  sellerId: 10,
  seller: { id: 10, shopName: 'ToyWorld', shopLogoUrl: null },
  category: { id: 1, categoryName: 'Flash Cards' },
  ageRange: { id: 2, label: '3+', minAge: 3, maxAge: 5 },
  productDetail: null,
};

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated products with total count', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const actualResult = await service.findAll({ page: 1, limit: 20 });

      expect(actualResult.products).toHaveLength(1);
      expect(actualResult.total).toBe(1);
      expect(actualResult.totalPages).toBe(1);
    });

    it('applies search filter to query', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'flash', page: 1, limit: 20 });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.OR).toBeDefined();
    });

    it('applies categoryId filter when provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ categoryId: 3, page: 1, limit: 20 });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.categoryId).toBe(3);
    });

    it('only returns Available products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toBe('Available');
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns a product when found', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const actualResult = await service.findById(1);

      expect(actualResult.id).toBe(1);
      expect(actualResult.name).toBe('ABC Flash Cards');
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes product by setting status to Unavailable', async () => {
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        status: 'Unavailable',
      });

      await service.remove(1, 10);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, sellerId: 10 },
          data: { status: 'Unavailable' },
        }),
      );
    });

    it('throws NotFoundException when product not found or not owned by seller', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '',
        },
      );
      mockPrisma.product.update.mockRejectedValue(p2025);

      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    });
  });
});
