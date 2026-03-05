import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(255)
  imageUrl: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  ageRangeId: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  // Optional product detail
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  length?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  material?: string;
}
