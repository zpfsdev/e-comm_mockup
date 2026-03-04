import {
  Body,
  Controller,
  Get,
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
import { CreateSellerDto } from './dto/create-seller.dto';
import { SellersService } from './sellers.service';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active shops' })
  findAll() {
    return this.sellersService.findAll();
  }

  /** Static "me/*" routes must be declared before ":id" so Express doesn't
   *  swallow "me" as a numeric id parameter. */
  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Get seller dashboard stats' })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.sellersService.getSellerDashboard(user.sub);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Get aggregate seller stats for dashboard' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.sellersService.getSellerStats(user.sub);
  }

  @Get('me/sales-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Seller)
  @ApiOperation({ summary: 'Get seller sales report (paginated)' })
  getSalesReport(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
  ) {
    return this.sellersService.getSalesReport(user.sub, page, limit);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleName.Customer)
  @ApiOperation({ summary: 'Register current user as a seller' })
  registerSeller(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSellerDto,
  ) {
    return this.sellersService.registerSeller(user.sub, dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get shop profile and products' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.sellersService.findById(id);
  }
}
