import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe Updated', description: 'Updated user full name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: true, description: 'Set user account active status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
