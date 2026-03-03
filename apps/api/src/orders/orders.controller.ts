import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser, type JwtPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(RoleName.Customer)
  @ApiOperation({ summary: 'Place a new order (Customer only)' })
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get order history for authenticated user (paginated)' })
  getOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.ordersService.findUserOrders(user.sub, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order with full tracking info' })
  getOrder(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.ordersService.findOrderById(id, user.sub);
  }

  @Patch('items/:orderItemId/status')
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Update order item status (Seller only)' })
  updateItemStatus(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.ordersService.updateOrderItemStatusForUser(orderItemId, user.sub, dto.status);
  }
}
