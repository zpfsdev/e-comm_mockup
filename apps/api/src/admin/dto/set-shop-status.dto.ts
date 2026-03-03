import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShopStatus } from '@prisma/client';

export class SetShopStatusDto {
  @ApiProperty({ enum: ShopStatus, example: ShopStatus.Active })
  @IsEnum(ShopStatus, { message: `status must be one of: ${Object.values(ShopStatus).join(', ')}` })
  status: ShopStatus;
}
