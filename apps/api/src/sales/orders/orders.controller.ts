import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CurrentUser,
  type JwtPayload,
} from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.Customer)
  @ApiOperation({ summary: 'Place a new order (Customer only)' })
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get order history for authenticated user (paginated)',
  })
  getOrders(
    @CurrentUser() user: JwtPayload,
    @Query() { page, limit, status }: OrdersQueryDto,
  ) {
    return this.ordersService.findUserOrders(user.sub, page, limit, status);
  }

  @Get('items/disputed')
  @Roles(RoleName.Admin)
  @ApiOperation({ summary: 'List all disputed order items (Admin)' })
  getDisputedItems() {
    return this.ordersService.findDisputedItems();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order with full tracking info' })
  getOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
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
    return this.ordersService.updateOrderItemStatusForUser(
      orderItemId,
      user.sub,
      dto.status,
    );
  }

  @Post('items/:orderItemId/dispute')
  @Roles(RoleName.Customer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispute a completed order item (Customer)' })
  requestRefund(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.requestRefund(orderItemId, user.sub, body?.reason);
  }

  @Patch('items/:orderItemId/resolve')
  @Roles(RoleName.Admin)
  @ApiOperation({ summary: 'Resolve a disputed item (Admin)' })
  resolveDispute(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @Body() body: { resolution: 'Refunded' | 'Completed' },
  ) {
    return this.ordersService.resolveDispute(orderItemId, body.resolution);
  }
}
