import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignToolsDto {
  @ApiProperty({
    example: ['tool-web-search', 'tool-send-email'],
    description: 'Array of tool IDs to assign/bind to this agent',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Please provide at least one tool ID to assign.' })
  @IsString({ each: true })
  toolIds: string[];
}
