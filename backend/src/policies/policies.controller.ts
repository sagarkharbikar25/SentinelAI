import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('Policies')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new security governance policy (ADMIN / SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Policy created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin roles.' })
  async create(@Body() createPolicyDto: CreatePolicyDto) {
    const policy = await this.policiesService.create(createPolicyDto);
    return {
      success: true,
      data: policy,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'List all active governance policies' })
  @ApiResponse({ status: 200, description: 'Returns list of all policies.' })
  async findAll() {
    const policies = await this.policiesService.findAll();
    return {
      success: true,
      data: policies,
      meta: {
        total: policies.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Fetch policy details and active governance rules' })
  @ApiResponse({ status: 200, description: 'Returns policy details.' })
  async findOne(@Param('id') id: string) {
    const policy = await this.policiesService.findOne(id);
    return {
      success: true,
      data: policy,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update governance policy (ADMIN / SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully.' })
  async update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    const policy = await this.policiesService.update(id, updatePolicyDto);
    return {
      success: true,
      data: policy,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete governance policy (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Policy deleted successfully.' })
  async remove(@Param('id') id: string) {
    const result = await this.policiesService.remove(id);
    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
