import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly MAX_REVIEW_PAGE_SIZE = 50;

  async createReview(userId: number, orderItemId: number, dto: CreateReviewDto) {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { userId } },
    });

    if (!orderItem) throw new NotFoundException('Order item not found.');
    if (orderItem.orderItemStatus !== 'Completed') {
      throw new BadRequestException('You can only review completed order items.');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { userId, orderItemId },
      select: { id: true },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this order item.');
    }

    return this.prisma.review.create({
      data: { userId, orderItemId, ...dto },
    });
  }

  findByProduct(productId: number, page = 1, limit = 20) {
    const safeLimit = Math.min(limit, ReviewsService.MAX_REVIEW_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    return this.prisma.review.findMany({
      where: { orderItem: { productId } },
      include: { user: { select: { firstName: true, lastName: true, profilePictureUrl: true } } },
      orderBy: [{ datePosted: 'desc' }, { id: 'desc' }],
      take: safeLimit,
      skip,
    });
  }
}
