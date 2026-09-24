import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AssignToolsDto } from './dto/assign-tools.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('Agents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new AI Agent (ADMIN / SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Agent successfully registered.' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin roles.' })
  async create(@Request() req: any, @Body() createAgentDto: CreateAgentDto) {
    const userId = req?.user?.userId || 'usr-superadmin-001';
    const agent = await this.agentsService.create(userId, createAgentDto);
    return {
      success: true,
      data: agent,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'List all registered AI Agents' })
  @ApiResponse({ status: 200, description: 'Returns list of all agents.' })
  async findAll() {
    const agents = await this.agentsService.findAll();
    return {
      success: true,
      data: agents,
      meta: {
        total: agents.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Fetch AI Agent details and capability tool bindings' })
  @ApiResponse({ status: 200, description: 'Returns agent details.' })
  async findOne(@Param('id') id: string) {
    const agent = await this.agentsService.findOne(id);
    return {
      success: true,
      data: agent,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update AI Agent settings' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully.' })
  async update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    const agent = await this.agentsService.update(id, updateAgentDto);
    return {
      success: true,
      data: agent,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete or remove an AI Agent (ADMIN / SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Agent deleted successfully.' })
  async remove(@Param('id') id: string) {
    const result = await this.agentsService.remove(id);
    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(':id/tools')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign allowed tool capabilities to an AI Agent' })
  @ApiResponse({ status: 200, description: 'Tools assigned to agent successfully.' })
  async assignTools(@Param('id') id: string, @Body() assignToolsDto: AssignToolsDto) {
    const agent = await this.agentsService.assignTools(id, assignToolsDto);
    return {
      success: true,
      data: agent,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
