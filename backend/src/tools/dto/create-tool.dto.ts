import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateToolDto {
  @ApiProperty({ example: 'WEB_SEARCH', description: 'Unique tool name identifier' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Search public internet via Bing/Google API', description: 'Detailed tool description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.MEDIUM, description: 'Sensitivity risk level of tool' })
  @IsEnum(RiskLevel)
  @IsNotEmpty()
  riskLevel: RiskLevel;

  @ApiProperty({ example: 'tools:web_search', description: 'Required permission key' })
  @IsString()
  @IsNotEmpty()
  requiredPermission: string;
}
