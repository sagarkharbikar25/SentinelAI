import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Backend API Root Welcome' })
  getRoot() {
    return {
      success: true,
      data: {
        message: 'Welcome to SentinelAI Backend API Gateway',
        version: '1.0.0',
        documentation: 'http://localhost:3001/api/docs',
        health: 'http://localhost:3001/health',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'System Health Check' })
  @ApiResponse({ status: 200, description: 'Backend service is up and running.' })
  getHealth() {
    return {
      success: true,
      data: this.appService.getHealth(),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
