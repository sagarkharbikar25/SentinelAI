import { Controller, Get, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all registered users (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Returns list of all users.' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-superadmin.' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
      meta: {
        total: users.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Fetch user profile details by ID' })
  @ApiResponse({ status: 200, description: 'Returns user profile.' })
  @ApiResponse({ status: 403, description: 'Forbidden if requesting another user without admin role.' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const currentUser = req.user;
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
      throw new ForbiddenException('Access denied. You may only view your own user profile.');
    }

    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Update user profile details' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
  async updateProfile(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    const currentUser = req.user;
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.userId !== id) {
      throw new ForbiddenException('Access denied. You may only update your own user profile.');
    }

    const user = await this.usersService.updateProfile(id, updateUserDto);
    return {
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Promote or change user RBAC system role (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-superadmin.' })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateUserRoleDto) {
    const user = await this.usersService.updateRole(id, updateRoleDto);
    return {
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
