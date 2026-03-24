import { Module } from '@nestjs/common';

// Orders
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';

// Sellers
import { SellersController } from './sellers/sellers.controller';
import { SellersService } from './sellers/sellers.service';

// Cart
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';

@Module({
  controllers: [OrdersController, SellersController, CartController],
  providers: [OrdersService, SellersService, CartService],
  exports: [OrdersService, SellersService, CartService],
})
export class SalesModule {}
