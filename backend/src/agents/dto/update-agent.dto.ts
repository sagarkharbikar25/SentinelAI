import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgentType } from './create-agent.dto';
import { RiskLevel } from '../../tools/dto/create-tool.dto';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class UpdateAgentDto {
  @ApiProperty({ example: 'Updated Agent Name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AgentStatus, example: AgentStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.HIGH, required: false })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}
