import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser, type JwtPayload } from '../core/decorators/current-user.decorator';
import { Public } from '../core/decorators/public.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Get all products belonging to the authenticated seller' })
  getMyProducts(@CurrentUser() user: JwtPayload) {
    return this.productsService.findByUserId(user.sub);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse all available products with optional filters' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Create a new product (Seller only)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.productsService.createForUser(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Update a product (Seller only, own products)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateForUser(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Remove a product (marks as unavailable, Seller only)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.productsService.removeForUser(id, user.sub);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product details by ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }
}
