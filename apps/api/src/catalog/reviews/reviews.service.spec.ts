import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewsService } from './reviews.service';
import type { CreateReviewDto } from './dto/create-review.dto';

const mockPrisma = {
  $transaction: jest.fn(),
  orderItem: {
    findFirst: jest.fn(),
  },
  review: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaService;

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const inputUserId = 5;
    const inputOrderItemId = 42;
    const inputDto: CreateReviewDto = { rating: 5, comment: 'Great!' };

    it('creates a review for a completed order item when none exists yet', async () => {
      const mockOrderItem = {
        id: inputOrderItemId,
        orderItemStatus: 'Completed',
      };
      const createdReview = {
        id: 1,
        rating: 5,
        comment: 'Great!',
        datePosted: new Date('2026-01-01T00:00:00Z'),
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (cb: (tx: PrismaService) => Promise<unknown>) => cb(mockPrisma),
      );
      (mockPrisma.orderItem.findFirst as any).mockResolvedValue(mockOrderItem);
      (mockPrisma.review.findFirst as any).mockResolvedValue(null);
      (mockPrisma.review.create as any).mockResolvedValue(createdReview);

      const actual = await service.createReview(
        inputUserId,
        inputOrderItemId,
        inputDto,
      );

      expect(actual).toEqual(createdReview);
      expect(mockPrisma.orderItem.findFirst).toHaveBeenCalledWith({
        where: { id: inputOrderItemId, order: { userId: inputUserId } },
      });
      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
        where: { userId: inputUserId, orderItemId: inputOrderItemId },
        select: { id: true },
      });
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          userId: inputUserId,
          orderItemId: inputOrderItemId,
          rating: inputDto.rating,
          comment: inputDto.comment,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          datePosted: true,
        },
      });
    });

    it('throws NotFoundException when order item is not owned by the user', async () => {
      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (cb: (tx: PrismaService) => Promise<unknown>) => cb(mockPrisma),
      );
      (mockPrisma.orderItem.findFirst as any).mockResolvedValue(null);

      await expect(
        service.createReview(inputUserId, inputOrderItemId, inputDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it('rejects when order item is not completed', async () => {
      const mockOrderItem = {
        id: inputOrderItemId,
        orderItemStatus: 'Pending',
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (cb: (tx: PrismaService) => Promise<unknown>) => cb(mockPrisma),
      );
      (mockPrisma.orderItem.findFirst as any).mockResolvedValue(mockOrderItem);

      await expect(
        service.createReview(inputUserId, inputOrderItemId, inputDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it('rejects when a review already exists for the user/order item pair', async () => {
      const mockOrderItem = {
        id: inputOrderItemId,
        orderItemStatus: 'Completed',
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (cb: (tx: PrismaService) => Promise<unknown>) => cb(mockPrisma),
      );
      (mockPrisma.orderItem.findFirst as any).mockResolvedValue(mockOrderItem);
      (mockPrisma.review.findFirst as any).mockResolvedValue({ id: 99 });

      await expect(
        service.createReview(inputUserId, inputOrderItemId, inputDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('findByProduct', () => {
    it('delegates to Prisma with pagination and productId filter', async () => {
      const mockReviews = [
        {
          id: 1,
          rating: 4,
          comment: 'Nice',
          datePosted: new Date('2026-01-01T00:00:00Z'),
          user: {
            firstName: 'Alice',
            lastName: 'Smith',
            profilePictureUrl: null,
          },
        },
      ];
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

      const actual = await service.findByProduct(3, 2, 10);

      expect(actual).toEqual(mockReviews);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { orderItem: { productId: 3 } },
        select: {
          id: true,
          rating: true,
          comment: true,
          datePosted: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: [{ datePosted: 'desc' }, { id: 'desc' }],
        take: 10,
        skip: 10,
      });
    });
  });
});
