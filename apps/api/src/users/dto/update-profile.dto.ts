import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(\+63|0)[0-9]{10}$/, {
    message: 'Invalid Philippine contact number',
  })
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;
}
