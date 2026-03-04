import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName, UserStatus } from '@prisma/client';
import {
  CurrentUser,
  type JwtPayload,
} from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { AdminService } from '../admin/admin.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetUserActiveDto } from './dto/set-user-active.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get()
  @Roles(RoleName.Admin)
  @ApiOperation({ summary: 'Admin: list users for dashboard' })
  async findAllForAdmin(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    const users = await this.adminService.findAllUsers(page, limit);
    return users.map((user) => {
      const roleNames = user.userRoles.map((ur) => ur.role.roleName);
      const primaryRole = roleNames.includes(RoleName.Admin)
        ? 'ADMIN'
        : roleNames.includes(RoleName.Seller)
          ? 'SELLER'
          : 'BUYER';
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: primaryRole,
        isActive: user.status === UserStatus.Active,
      };
    });
  }

  @Patch(':id')
  @Roles(RoleName.Admin)
  @ApiOperation({ summary: 'Admin: toggle user active status' })
  async toggleUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetUserActiveDto,
  ) {
    const status = body.isActive ? UserStatus.Active : UserStatus.Inactive;
    await this.adminService.setUserStatus(id, status);
    return { success: true };
  }
}
