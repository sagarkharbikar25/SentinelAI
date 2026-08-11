import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly authService: AuthService) {}

  async findAll() {
    return this.authService.getAllUsers();
  }

  async findOne(id: string) {
    const user = await this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }
    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;
    return user;
  }

  async updateRole(id: string, updateRoleDto: UpdateUserRoleDto) {
    const user = await this.findOne(id);
    user.role = updateRoleDto.role;
    return user;
  }
}
