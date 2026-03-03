import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

/** Inline delivery address — used when the customer enters an address at checkout
 *  without having a saved UserAddress record. */
export class DeliveryAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  streetLine: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barangay?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  city: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  /** Saved address ID — mutually exclusive with `deliveryAddress`. */
  @ApiPropertyOptional({ description: 'UserAddress ID to ship to (for saved addresses)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userAddressId?: number;

  /** Inline address — used when no saved address is selected. */
  @ApiPropertyOptional({ type: DeliveryAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
