import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query parameters for filtering orders by status and pagination. */
export class OrdersQueryDto extends PaginationQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
