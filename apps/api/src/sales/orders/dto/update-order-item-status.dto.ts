import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItemStatus } from '@prisma/client';

export class UpdateOrderItemStatusDto {
  @ApiProperty({ enum: OrderItemStatus, example: OrderItemStatus.InTransit })
  @IsEnum(OrderItemStatus, {
    message: `status must be one of: ${Object.values(OrderItemStatus).join(', ')}`,
  })
  status: OrderItemStatus;
}
