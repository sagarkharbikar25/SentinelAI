import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('Tools')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new tool capability (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Tool registered successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-superadmin.' })
  async create(@Body() createToolDto: CreateToolDto) {
    const tool = await this.toolsService.create(createToolDto);
    return {
      success: true,
      data: tool,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'List all registered tool capabilities' })
  @ApiResponse({ status: 200, description: 'Returns list of all registered tools.' })
  async findAll() {
    const tools = await this.toolsService.findAll();
    return {
      success: true,
      data: tools,
      meta: {
        total: tools.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Fetch tool capability details by ID' })
  @ApiResponse({ status: 200, description: 'Returns tool details.' })
  async findOne(@Param('id') id: string) {
    const tool = await this.toolsService.findOne(id);
    return {
      success: true,
      data: tool,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tool risk level and parameters (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Tool updated successfully.' })
  async update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    const tool = await this.toolsService.update(id, updateToolDto);
    return {
      success: true,
      data: tool,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
