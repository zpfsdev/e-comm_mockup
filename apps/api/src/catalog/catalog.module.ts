import { Module } from '@nestjs/common';

// Products
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

// Categories
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

// Reviews
import { ReviewsController } from './reviews/reviews.controller';
import { ReviewsService } from './reviews/reviews.service';

@Module({
  controllers: [ProductsController, CategoriesController, ReviewsController],
  providers: [ProductsService, CategoriesService, ReviewsService],
  exports: [ProductsService, CategoriesService],
})
export class CatalogModule {}
