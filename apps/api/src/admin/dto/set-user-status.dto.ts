import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class SetUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.Active })
  @IsEnum(UserStatus, { message: `status must be one of: ${Object.values(UserStatus).join(', ')}` })
  status: UserStatus;
}
