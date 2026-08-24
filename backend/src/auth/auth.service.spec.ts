import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from '../../supabase/supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            client: null,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user with hashed password', async () => {
      const dto = {
        email: 'newuser@sentinelai.io',
        name: 'New User',
        password: 'Password123!',
      };

      const result = await service.register(dto);
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(dto.email);
      expect(result.name).toBe(dto.name);
      expect(result.role).toBe('VIEWER');
    });

    it('should throw ConflictException if email is already registered', async () => {
      const dto = {
        email: 'admin@sentinelai.io', // Already seeded in AuthService
        name: 'Duplicate Admin',
        password: 'Password123!',
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully authenticate seeded admin user and return JWT bearer token', async () => {
      const dto = {
        email: 'admin@sentinelai.io',
        password: 'AdminPass123!',
      };

      const result = await service.login(dto);
      expect(result.accessToken).toBe('mock_jwt_token_xyz');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user.email).toBe('admin@sentinelai.io');
      expect(result.user.role).toBe('SUPER_ADMIN');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const dto = {
        email: 'admin@sentinelai.io',
        password: 'WrongPassword!',
      };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
