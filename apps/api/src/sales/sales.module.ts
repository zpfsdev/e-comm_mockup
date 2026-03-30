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

// Commissions
import { CommissionsController } from './commissions/commissions.controller';
import { CommissionsService } from './commissions/commissions.service';

@Module({
  controllers: [OrdersController, SellersController, CartController, CommissionsController],
  providers: [OrdersService, SellersService, CartService, CommissionsService],
  exports: [OrdersService, SellersService, CartService, CommissionsService],
})
export class SalesModule {}
