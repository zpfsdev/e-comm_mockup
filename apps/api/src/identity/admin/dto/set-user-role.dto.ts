import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class SetUserRoleDto {
  @ApiProperty({ enum: RoleName, example: RoleName.Seller })
  @IsEnum(RoleName, {
    message: `role must be one of: ${Object.values(RoleName).join(', ')}`,
  })
  role: RoleName;
}
