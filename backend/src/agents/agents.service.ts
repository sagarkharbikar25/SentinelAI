import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAgentDto, AgentType } from './dto/create-agent.dto';
import { UpdateAgentDto, AgentStatus } from './dto/update-agent.dto';
import { AssignToolsDto } from './dto/assign-tools.dto';
import { RiskLevel } from '../tools/dto/create-tool.dto';
import { ToolsService } from '../tools/tools.service';

export interface AgentEntity {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  riskLevel: RiskLevel;
  ownerId: string;
  assignedToolIds: string[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AgentsService {
  private agents: Map<string, AgentEntity> = new Map();

  constructor(private readonly toolsService: ToolsService) {
    this.seedDefaultAgents();
  }

  private seedDefaultAgents() {
    const defaultAgents: AgentEntity[] = [
      {
        id: 'agent-research-01',
        name: 'Research & Search Agent',
        description: 'Autonomously gathers literature and searches web sources.',
        type: AgentType.RESEARCH,
        status: AgentStatus.ACTIVE,
        riskLevel: RiskLevel.LOW,
        ownerId: 'usr-superadmin-001',
        assignedToolIds: ['tool-web-search'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'agent-email-02',
        name: 'Enterprise Email Assistant',
        description: 'Reads inbound queries and drafts/sends external email responses.',
        type: AgentType.EMAIL,
        status: AgentStatus.ACTIVE,
        riskLevel: RiskLevel.MEDIUM,
        ownerId: 'usr-developer-002',
        assignedToolIds: ['tool-web-search', 'tool-send-email'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const agent of defaultAgents) {
      this.agents.set(agent.id, agent);
    }
  }

  async create(ownerId: string, createAgentDto: CreateAgentDto) {
    const newAgent: AgentEntity = {
      id: `agent-${Date.now()}`,
      name: createAgentDto.name,
      description: createAgentDto.description,
      type: createAgentDto.type,
      status: AgentStatus.ACTIVE,
      riskLevel: createAgentDto.riskLevel || RiskLevel.MEDIUM,
      ownerId,
      assignedToolIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(newAgent.id, newAgent);
    return this.formatAgentResponse(newAgent);
  }

  async findAll() {
    const list = Array.from(this.agents.values());
    return Promise.all(list.map((a) => this.formatAgentResponse(a)));
  }

  async findOne(id: string) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID '${id}' not found.`);
    }
    return this.formatAgentResponse(agent);
  }

  async update(id: string, updateAgentDto: UpdateAgentDto) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID '${id}' not found.`);
    }

    if (updateAgentDto.name) agent.name = updateAgentDto.name;
    if (updateAgentDto.description) agent.description = updateAgentDto.description;
    if (updateAgentDto.status) agent.status = updateAgentDto.status;
    if (updateAgentDto.riskLevel) agent.riskLevel = updateAgentDto.riskLevel;
    agent.updatedAt = new Date().toISOString();

    return this.formatAgentResponse(agent);
  }

  async remove(id: string) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID '${id}' not found.`);
    }
    this.agents.delete(id);
    return { id, message: 'Agent deleted successfully.' };
  }

  async assignTools(id: string, assignToolsDto: AssignToolsDto) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID '${id}' not found.`);
    }

    // Verify all tool IDs exist
    for (const toolId of assignToolsDto.toolIds) {
      await this.toolsService.findOne(toolId);
    }

    agent.assignedToolIds = Array.from(new Set([...agent.assignedToolIds, ...assignToolsDto.toolIds]));
    agent.updatedAt = new Date().toISOString();

    return this.formatAgentResponse(agent);
  }

  private async formatAgentResponse(agent: AgentEntity) {
    const tools = await Promise.all(
      agent.assignedToolIds.map(async (tId) => {
        try {
          const tool = await this.toolsService.findOne(tId);
          return {
            id: tool.id,
            name: tool.name,
            riskLevel: tool.riskLevel,
            isAllowed: tool.isActive,
          };
        } catch {
          return null;
        }
      }),
    );

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      status: agent.status,
      riskLevel: agent.riskLevel,
      ownerId: agent.ownerId,
      tools: tools.filter((t) => t !== null),
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}
