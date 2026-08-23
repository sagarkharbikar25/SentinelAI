import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/decorators/roles.decorator';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Seeded mock user repository for immediate testing prior to DB connection
  private users: Map<string, UserEntity> = new Map();

  constructor(private readonly jwtService: JwtService) {
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const adminHash = await bcrypt.hash('AdminPass123!', 12);
    const devHash = await bcrypt.hash('DevPass123!', 12);

    const superAdmin: UserEntity = {
      id: 'usr-superadmin-001',
      email: 'admin@sentinelai.io',
      name: 'Super Admin User',
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const developer: UserEntity = {
      id: 'usr-developer-002',
      email: 'dev@sentinelai.io',
      name: 'Developer User',
      passwordHash: devHash,
      role: UserRole.DEVELOPER,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.users.set(superAdmin.email.toLowerCase(), superAdmin);
    this.users.set(developer.email.toLowerCase(), developer);
    this.logger.log('Seeded default admin and developer users for Auth testing.');
  }

  async register(registerDto: RegisterDto) {
    const emailKey = registerDto.email.toLowerCase();

    if (this.users.has(emailKey)) {
      throw new ConflictException(`User with email '${registerDto.email}' already exists.`);
    }

    // Hash password with 12 rounds of bcrypt
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const newUser: UserEntity = {
      id: `usr-${Date.now()}`,
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
      role: UserRole.VIEWER, // Default role assigned upon self-registration
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.users.set(emailKey, newUser);

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const emailKey = loginDto.email.toLowerCase();
    const user = this.users.get(emailKey);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive. Please contact administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async getUserById(userId: string) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        };
      }
    }
    throw new UnauthorizedException('User not found.');
  }

  async getAllUsers() {
    return Array.from(this.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }
}
