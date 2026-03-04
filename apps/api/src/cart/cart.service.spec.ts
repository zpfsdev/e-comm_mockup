// cart.service.spec.ts intentionally left empty for now; tests will be added later.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from './cart.service';

const mockCart = {
  id: 1,
  userId: 42,
  cartItems: [
    {
      id: 10,
      cartId: 1,
      productId: 5,
      quantity: 2,
      dateAdded: new Date(),
      product: {
        id: 5,
        name: 'Story Book',
        imageUrl: null,
        price: '150.00',
        status: 'Available',
        stockQuantity: 20,
        seller: { id: 3, shopName: 'BookNook' },
      },
    },
  ],
};

const mockAvailableProduct = {
  id: 5,
  name: 'Story Book',
  imageUrl: null,
  price: '150.00',
  status: 'Available',
  stockQuantity: 20,
};

const mockPrisma = {
  cart: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  $transaction: jest
    .fn()
    .mockImplementation(
      async <T>(callback: (tx: typeof mockPrisma) => Promise<T>): Promise<T> =>
        callback(mockPrisma),
    ),
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  // ─── getCart ─────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns cart with items when cart exists', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const actualResult = await service.getCart(42);

      expect(actualResult.items).toHaveLength(1);
      expect(actualResult.items[0].product.name).toBe('Story Book');
    });

    it('throws NotFoundException when no cart is found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.getCart(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── addItem ─────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('upserts cart item for available product with sufficient stock', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.product.findUnique.mockResolvedValue(mockAvailableProduct);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.upsert.mockResolvedValue({ id: 10, quantity: 2 });

      const actualResult = await service.addItem(42, {
        productId: 5,
        quantity: 2,
      });

      expect(actualResult.quantity).toBe(2);
      expect(mockPrisma.cartItem.upsert).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException for unavailable product', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockAvailableProduct,
        status: 'Unavailable',
      });
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(42, { productId: 5, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when requested quantity exceeds stock', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockAvailableProduct,
        stockQuantity: 1,
      });
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(42, { productId: 5, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when product does not exist', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(42, { productId: 999, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateItem ──────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('updates quantity for non-zero value', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.product.findUnique.mockResolvedValue(mockAvailableProduct);
      mockPrisma.cartItem.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.cartItem.update.mockResolvedValue({ id: 10, quantity: 3 });

      const actualResult = await service.updateItem(42, 5, { quantity: 3 });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: 3 } }),
      );
      expect(actualResult).toBeDefined();
    });

    it('calls removeItem when quantity is 0', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.cartItem.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.cartItem.delete.mockResolvedValue(undefined);

      await service.updateItem(42, 5, { quantity: 0 });

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
    });
  });

  // ─── clearCart ───────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('deletes all items from the cart', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue({ id: 1 });
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      await service.clearCart(42);

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 1 },
      });
    });
  });
});
