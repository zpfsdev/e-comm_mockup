import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

export interface ReviewDto {
  readonly id: number;
  readonly rating: number;
  readonly comment: string | null;
  readonly datePosted: Date;
  readonly user: {
    readonly firstName: string;
    readonly lastName: string;
    readonly profilePictureUrl: string | null;
  };
}

export interface CreateReviewResponseDto {
  readonly id: number;
  readonly rating: number;
  readonly comment: string | null;
  readonly datePosted: Date;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly MAX_REVIEW_PAGE_SIZE = 50;

  async createReview(
    userId: number,
    orderItemId: number,
    dto: CreateReviewDto,
  ): Promise<CreateReviewResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findFirst({
        where: { id: orderItemId, order: { userId } },
      });

      if (!orderItem) throw new NotFoundException('Order item not found.');
      if (orderItem.orderItemStatus !== 'Completed') {
        throw new BadRequestException(
          'You can only review completed order items.',
        );
      }

      const existingReview = await tx.review.findFirst({
        where: { userId, orderItemId },
        select: { id: true },
      });
      if (existingReview) {
        throw new BadRequestException(
          'You have already reviewed this order item.',
        );
      }

      return tx.review.create({
        data: {
          userId,
          orderItemId,
          rating: dto.rating,
          comment: dto.comment,
        },
        select: { id: true, rating: true, comment: true, datePosted: true },
      });
    });
  }

  async findByProduct(
    productId: number,
    page = 1,
    limit = 20,
  ): Promise<ReviewDto[]> {
    const safeLimit = Math.min(limit, ReviewsService.MAX_REVIEW_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    return this.prisma.review.findMany({
      where: { orderItem: { productId } },
      select: {
        id: true,
        rating: true,
        comment: true,
        datePosted: true,
        user: {
          select: { firstName: true, lastName: true, profilePictureUrl: true },
        },
      },
      orderBy: [{ datePosted: 'desc' }, { id: 'desc' }],
      take: safeLimit,
      skip,
    });
  }
}
