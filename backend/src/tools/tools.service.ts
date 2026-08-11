import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateToolDto, RiskLevel } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

export interface ToolEntity {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  requiredPermission: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable()
export class ToolsService {
  private tools: Map<string, ToolEntity> = new Map();

  constructor() {
    this.seedDefaultTools();
  }

  private seedDefaultTools() {
    const defaultTools: ToolEntity[] = [
      {
        id: 'tool-web-search',
        name: 'WEB_SEARCH',
        description: 'Searches web resources for public real-time data.',
        riskLevel: RiskLevel.LOW,
        requiredPermission: 'tools:web_search',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tool-send-email',
        name: 'SEND_EMAIL',
        description: 'Sends external emails on behalf of the user.',
        riskLevel: RiskLevel.MEDIUM,
        requiredPermission: 'tools:send_email',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tool-db-query',
        name: 'EXECUTE_SQL',
        description: 'Executes SQL database queries against core databases.',
        riskLevel: RiskLevel.HIGH,
        requiredPermission: 'tools:execute_sql',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    for (const tool of defaultTools) {
      this.tools.set(tool.id, tool);
    }
  }

  async create(createToolDto: CreateToolDto) {
    const existing = Array.from(this.tools.values()).find(
      (t) => t.name.toUpperCase() === createToolDto.name.toUpperCase(),
    );

    if (existing) {
      throw new ConflictException(`Tool with name '${createToolDto.name}' already exists.`);
    }

    const newTool: ToolEntity = {
      id: `tool-${Date.now()}`,
      name: createToolDto.name.toUpperCase(),
      description: createToolDto.description,
      riskLevel: createToolDto.riskLevel,
      requiredPermission: createToolDto.requiredPermission,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.tools.set(newTool.id, newTool);
    return newTool;
  }

  async findAll() {
    return Array.from(this.tools.values());
  }

  async findOne(id: string) {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new NotFoundException(`Tool with ID '${id}' not found.`);
    }
    return tool;
  }

  async update(id: string, updateToolDto: UpdateToolDto) {
    const tool = await this.findOne(id);

    if (updateToolDto.description !== undefined) tool.description = updateToolDto.description;
    if (updateToolDto.riskLevel !== undefined) tool.riskLevel = updateToolDto.riskLevel;
    if (updateToolDto.requiredPermission !== undefined) tool.requiredPermission = updateToolDto.requiredPermission;
    if (updateToolDto.isActive !== undefined) tool.isActive = updateToolDto.isActive;

    return tool;
  }
}
