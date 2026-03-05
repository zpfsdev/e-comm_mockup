import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import {
  CurrentUser,
  type JwtPayload,
} from '../core/decorators/current-user.decorator';
import { Public } from '../core/decorators/public.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Get reviews for a product (paginated)' })
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.reviewsService.findByProduct(productId, page, limit);
  }

  @Post('order-items/:orderItemId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Customer)
  @ApiOperation({ summary: 'Post a review for a completed order item' })
  createReview(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.sub, orderItemId, dto);
  }
}
