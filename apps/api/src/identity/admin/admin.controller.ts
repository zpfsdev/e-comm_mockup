import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../core/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { SetShopStatusDto } from './dto/set-shop-status.dto';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { Post } from '@nestjs/common';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(RoleName.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  findAllUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.adminService.findAllUsers(page, limit);
  }

  @Get('shops')
  @ApiOperation({ summary: 'List all shops/sellers (paginated)' })
  findAllShops(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.adminService.findAllShops(page, limit);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  setUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.adminService.setUserStatus(id, dto.status);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Elevate or demote user roles securely' })
  setUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRoleDto,
  ) {
    return this.adminService.setUserRole(id, dto.role);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Forcibly reset a user password' })
  resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword?: string }
  ) {
    return this.adminService.resetUserPassword(id, body.newPassword);
  }

  @Patch('shops/:id/status')
  @ApiOperation({ summary: 'Set shop status (Active/Inactive/Banned)' })
  setShopStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetShopStatusDto,
  ) {
    return this.adminService.setShopStatus(id, dto.status);
  }

  @Get('test')
  @ApiOperation({ summary: 'Smoke test' })
  test(): { status: string } {
    return { status: 'admin module ok' };
  }
}
