import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

const mockProducts = [
  {
    id: 1,
    price: new Prisma.Decimal('199.00'),
    stockQuantity: 10,
    sellerId: 5,
  },
  {
    id: 2,
    price: new Prisma.Decimal('299.00'),
    stockQuantity: 5,
    sellerId: 6,
  },
];

const mockCreatedOrder = {
  id: 100,
  userId: 42,
  totalAmount: new Prisma.Decimal('556.00'),
  shippingFee: new Prisma.Decimal('58.00'),
  orderDate: new Date(),
  orderItems: [
    {
      id: 201,
      productId: 1,
      quantity: 1,
      price: new Prisma.Decimal('199.00'),
      product: { id: 1, name: 'Product 1', imageUrl: 'image-1' },
      orderItemStatus: 'Pending',
      dateDelivered: null,
    },
    {
      id: 202,
      productId: 2,
      quantity: 1,
      price: new Prisma.Decimal('299.00'),
      product: { id: 2, name: 'Product 2', imageUrl: 'image-2' },
      orderItemStatus: 'Pending',
      dateDelivered: null,
    },
  ],
  payment: {
    id: 301,
    paymentStatus: 'Unpaid',
    paymentAmount: new Prisma.Decimal('556.00'),
  },
  userAddress: null,
};

const mockTx = {
  product: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  order: { create: jest.fn().mockResolvedValue(mockCreatedOrder) },
  commission: { create: jest.fn() },
  cartItem: { deleteMany: jest.fn() },
};

const mockPrisma = {
  product: { findMany: jest.fn() },
  userAddress: { findFirst: jest.fn() },
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  orderItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback: (tx: typeof mockTx) => Promise<unknown>) =>
    callback(mockTx),
  ),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ORDERS_SHIPPING_FEE') return 58;
              if (key === 'ORDERS_COMMISSION_RATE') return 0.05;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  // ─── createOrder ─────────────────────────────────────────────────────────────

  describe('createOrder', () => {
    const inputCreateOrderDto = {
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 1 },
      ],
      userAddressId: 7,
    };

    it('creates order, decrements stock, and records commissions', async () => {
      mockPrisma.userAddress.findFirst.mockResolvedValue({ id: 7 });
      mockTx.product.findMany.mockResolvedValue(mockProducts);

      const actualResult = await service.createOrder(42, inputCreateOrderDto);

      expect(actualResult.id).toBe(100);
      expect(mockTx.product.update).toHaveBeenCalledTimes(2);
      expect(mockTx.commission.create).toHaveBeenCalledTimes(2);
    });

    it('throws BadRequestException when a product is unavailable', async () => {
      mockPrisma.userAddress.findFirst.mockResolvedValue({ id: 7 });
      mockTx.product.findMany.mockResolvedValue([mockProducts[0]]);

      await expect(
        service.createOrder(42, inputCreateOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      const lowStockProducts = [
        { ...mockProducts[0], stockQuantity: 0 },
        mockProducts[1],
      ];
      mockPrisma.userAddress.findFirst.mockResolvedValue({ id: 7 });
      mockTx.product.findMany.mockResolvedValue(lowStockProducts);

      await expect(
        service.createOrder(42, {
          items: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
          ],
          userAddressId: 7,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates commission records with 5% of item value', async () => {
      mockPrisma.userAddress.findFirst.mockResolvedValue({ id: 7 });
      mockTx.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockTx.order.create.mockResolvedValueOnce({
        ...mockCreatedOrder,
        orderItems: [
          {
            id: 201,
            productId: 1,
            quantity: 2,
            price: new Prisma.Decimal('199.00'),
            product: { id: 1, name: 'Product 1', imageUrl: 'image-1' },
            orderItemStatus: 'Pending',
            dateDelivered: null,
          },
        ],
      });

      await service.createOrder(42, {
        items: [{ productId: 1, quantity: 2 }],
        userAddressId: 7,
      });

      const commissionCall = mockTx.commission.create.mock.calls[0][0];
      expect(Number(commissionCall.data.commissionAmount)).toBeCloseTo(
        199 * 2 * 0.05,
        2,
      );
    });
  });

  // ─── findUserOrders ──────────────────────────────────────────────────────────

  describe('findUserOrders', () => {
    it('returns paginated orders with total and page metadata', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockCreatedOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const actualResult = await service.findUserOrders(42, 1, 20);

      expect(actualResult).toEqual(
        expect.objectContaining({
          orders: [
            expect.objectContaining({
              id: mockCreatedOrder.id,
            }),
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      );
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 42 },
          orderBy: { orderDate: 'desc' },
        }),
      );
      expect(mockPrisma.order.count).toHaveBeenCalledWith({
        where: { userId: 42 },
      });
    });
  });

  // ─── findOrderById ───────────────────────────────────────────────────────────

  describe('findOrderById', () => {
    it('returns order when it belongs to the requesting user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockCreatedOrder);

      const actualResult = await service.findOrderById(100, 42);

      expect(actualResult.id).toBe(100);
    });

    it('throws NotFoundException when order is not found or belongs to another user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOrderById(100, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateOrderItemStatus ───────────────────────────────────────────────────

  describe('updateOrderItemStatus', () => {
    it('updates order item status for the owning seller', async () => {
      mockPrisma.orderItem.findUnique.mockResolvedValue({
        id: 201,
        product: { sellerId: 5 },
        order: { id: 100 },
      });
      mockPrisma.orderItem.update.mockResolvedValue({
        id: 201,
        orderItemStatus: 'InTransit',
      });

      const actualResult = await service.updateOrderItemStatus(
        201,
        5,
        'InTransit',
      );

      expect(mockPrisma.orderItem.update).toHaveBeenCalledTimes(1);
      expect(actualResult.orderItemStatus).toBe('InTransit');
    });

    it('sets dateDelivered when status becomes Completed', async () => {
      mockPrisma.orderItem.findUnique.mockResolvedValue({
        id: 201,
        product: { sellerId: 5 },
        order: { id: 100 },
      });
      mockPrisma.orderItem.update.mockResolvedValue({
        id: 201,
        orderItemStatus: 'Completed',
      });

      await service.updateOrderItemStatus(201, 5, 'Completed');

      const updateCall = mockPrisma.orderItem.update.mock.calls[0][0];
      expect(updateCall.data.dateDelivered).toBeInstanceOf(Date);
    });

    it('throws ForbiddenException when seller does not own the order item', async () => {
      mockPrisma.orderItem.findUnique.mockResolvedValue({
        id: 201,
        product: { sellerId: 99 },
        order: { id: 100 },
      });

      await expect(
        service.updateOrderItemStatus(201, 5, 'InTransit'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when order item does not exist', async () => {
      mockPrisma.orderItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderItemStatus(999, 5, 'InTransit'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
