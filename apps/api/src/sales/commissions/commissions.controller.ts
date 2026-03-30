import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../core/decorators/roles.decorator';
import { CommissionsService } from './commissions.service';

@ApiTags('commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('pending')
  @Roles(RoleName.Admin)
  @ApiOperation({ summary: 'Get all sellers with unpaid commissions (Admin)' })
  getPendingBySeller() {
    return this.commissionsService.getPendingBySeller();
  }

  @Patch('settle/:sellerId')
  @Roles(RoleName.Admin)
  @ApiOperation({
    summary: 'Settle all unpaid commissions for a seller (Admin)',
  })
  settleBySeller(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Body() body: { referenceNumber: string },
  ) {
    return this.commissionsService.settleBySeller(
      sellerId,
      body.referenceNumber,
    );
  }
}
