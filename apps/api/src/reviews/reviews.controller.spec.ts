import { Test, type TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import type { CreateReviewDto } from './dto/create-review.dto';

const mockReviewsService: Pick<
  ReviewsService,
  'findByProduct' | 'createReview'
> = {
  findByProduct: jest.fn(),
  createReview: jest.fn(),
} as unknown as ReviewsService;

describe('ReviewsController', () => {
  let controller: ReviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    jest.clearAllMocks();
  });

  it('delegates findByProduct to ReviewsService with pagination defaults', async () => {
    const expectedResult = [{ id: 1 }];
    (mockReviewsService.findByProduct as jest.Mock).mockResolvedValue(
      expectedResult,
    );

    const actual = await controller.findByProduct(10, undefined, undefined);

    expect(mockReviewsService.findByProduct).toHaveBeenCalledWith(10, 1, 20);
    expect(actual).toBe(expectedResult);
  });

  it('delegates findByProduct to ReviewsService with explicit pagination', async () => {
    const expectedResult = [{ id: 2 }];
    (mockReviewsService.findByProduct as jest.Mock).mockResolvedValue(
      expectedResult,
    );

    const actual = await controller.findByProduct(5, 3, 50);

    expect(mockReviewsService.findByProduct).toHaveBeenCalledWith(5, 3, 50);
    expect(actual).toBe(expectedResult);
  });

  it('delegates createReview to ReviewsService using current user id', async () => {
    const inputUser = { sub: 42 } as { sub: number };
    const inputOrderItemId = 99;
    const inputDto: CreateReviewDto = {
      rating: 5,
      comment: 'Great!',
    };
    const expected = { id: 123 };
    (mockReviewsService.createReview as jest.Mock).mockResolvedValue(expected);

    const actual = await controller.createReview(
      inputOrderItemId,
      inputUser,
      inputDto,
    );

    expect(mockReviewsService.createReview).toHaveBeenCalledWith(
      inputUser.sub,
      inputOrderItemId,
      inputDto,
    );
    expect(actual).toBe(expected);
  });
});

