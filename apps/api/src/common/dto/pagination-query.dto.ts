import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Validated query DTO for paginated endpoints. Rejects page < 1 or limit < 1. */
export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
