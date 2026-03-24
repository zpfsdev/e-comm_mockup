import { IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;
}
