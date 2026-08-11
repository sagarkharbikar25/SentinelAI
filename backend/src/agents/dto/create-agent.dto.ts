import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiskLevel } from '../../tools/dto/create-tool.dto';

export enum AgentType {
  RESEARCH = 'RESEARCH',
  EMAIL = 'EMAIL',
  DATABASE = 'DATABASE',
  CODING = 'CODING',
}

export class CreateAgentDto {
  @ApiProperty({ example: 'Research Assistant Agent', description: 'Name of the AI Agent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Fetches academic papers and synthesizes web summaries', description: 'Agent description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AgentType, example: AgentType.RESEARCH, description: 'Type classification of the agent' })
  @IsEnum(AgentType)
  @IsNotEmpty()
  type: AgentType;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.MEDIUM, description: 'Default risk level', required: false })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}
