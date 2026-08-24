import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgentType } from '../../agents/dto/create-agent.dto';

export enum PolicyEffect {
  DENY = 'DENY',
  REQUIRE_CONFIRMATION = 'REQUIRE_CONFIRMATION',
}

export class CreatePolicyRuleDto {
  @ApiProperty({ enum: AgentType, example: AgentType.RESEARCH, required: false, description: 'Null applies to all agent types' })
  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @ApiProperty({ example: 'EXECUTE_SQL', required: false, description: 'Null applies to all tools' })
  @IsOptional()
  @IsString()
  toolName?: string;

  @ApiProperty({ example: 'DELETE', required: false, description: 'Operation identifier (DELETE, SEND_EMAIL, DROP_TABLE)' })
  @IsOptional()
  @IsString()
  operation?: string;

  @ApiProperty({ enum: PolicyEffect, example: PolicyEffect.DENY, description: 'Action effect (DENY or REQUIRE_CONFIRMATION)' })
  @IsEnum(PolicyEffect)
  @IsNotEmpty()
  effect: PolicyEffect;

  @ApiProperty({ example: 'Destructive database deletion is strictly prohibited by security policy.', description: 'Rule violation reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
