import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskLevel } from './create-tool.dto';

export class UpdateToolDto {
  @ApiProperty({ example: 'Updated description', description: 'Tool description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.HIGH, description: 'Sensitivity risk level', required: false })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiProperty({ example: 'tools:exec_query', description: 'Required permission key', required: false })
  @IsOptional()
  @IsString()
  requiredPermission?: string;

  @ApiProperty({ example: true, description: 'Tool active status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
