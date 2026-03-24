import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetUserActiveDto {
  @ApiProperty({ description: 'Whether the user account should be active' })
  @IsBoolean()
  isActive: boolean;
}
