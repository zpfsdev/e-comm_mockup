import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  type JwtPayload,
} from '../core/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({
    summary: 'Update cart item quantity (quantity=0 removes the item)',
  })
  async updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.cartService.updateItem(user.sub, productId, dto);
    if (result === undefined) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return result;
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeItem(user.sub, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the entire cart' })
  clearCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.clearCart(user.sub);
  }
}
