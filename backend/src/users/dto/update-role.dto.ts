import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/decorators/roles.decorator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'New system role to assign to the user',
  })
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole (SUPER_ADMIN, ADMIN, DEVELOPER, ANALYST, VIEWER).' })
  @IsNotEmpty()
  role: UserRole;
}
