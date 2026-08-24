import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePolicyRuleDto } from './create-policy-rule.dto';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Enterprise Data Governance Policy', description: 'Name of the policy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Restricts destructive SQL queries and unauthorized mass email dispatch.', description: 'Policy description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [CreatePolicyRuleDto], description: 'List of policy rules' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePolicyRuleDto)
  rules: CreatePolicyRuleDto[];
}
