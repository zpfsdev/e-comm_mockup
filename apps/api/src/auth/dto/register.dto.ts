import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ example: 'D.', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  middleName?: string;

  @ApiProperty({ example: 'dela Cruz' })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({ example: 'juandc' })
  @IsString()
  @Length(3, 50)
  username: string;

  @ApiProperty({ example: 'juan@email.com' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  password: string;

  @ApiProperty({ example: '1995-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '09171234567' })
  @IsString()
  @Matches(/^(\+63|0)[0-9]{10}$/, {
    message: 'Invalid Philippine contact number',
  })
  contactNumber: string;
}
