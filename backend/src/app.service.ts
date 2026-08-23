import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'UP',
      service: 'SentinelAI Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
