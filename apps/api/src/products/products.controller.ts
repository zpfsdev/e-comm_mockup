import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import {
  CurrentUser,
  type JwtPayload,
} from '../core/decorators/current-user.decorator';
import { Public } from '../core/decorators/public.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  normalizeCreateDto,
  normalizeUpdateDto,
} from './normalize-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Smoke test — must be declared before :id to avoid being captured by the param route. */
  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Smoke test' })
  test(): { status: string } {
    return { status: 'products module ok' };
  }

  @Get('mine')
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({
    summary: 'Get products belonging to the authenticated seller (paginated)',
  })
  getMyProducts(
    @CurrentUser() user: JwtPayload,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    return this.productsService.findByUserId(user.sub, page, limit);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Browse all available products with optional filters',
  })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Create a new product (Seller only)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    const normalized = normalizeCreateDto(dto);
    return this.productsService.createForUser(user.sub, normalized);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Update a product (Seller only, own products)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    const normalized = normalizeUpdateDto(dto);
    return this.productsService.updateForUser(id, user.sub, normalized);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({
    summary: 'Remove a product (marks as unavailable, Seller only)',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.removeForUser(id, user.sub);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product details by ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }
}
