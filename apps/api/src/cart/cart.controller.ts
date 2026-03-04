import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    return this.cartService.getCart(user.sub).then((cart) => ({
      items: cart.cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          stock: item.product.stockQuantity,
        },
      })),
    }));
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, productId, dto);
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
