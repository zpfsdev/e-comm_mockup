import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one number.';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword: string;

  @ApiProperty({ example: 'NewP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  newPassword: string;
}
