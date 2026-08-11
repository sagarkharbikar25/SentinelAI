import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3001;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Enable CORS for Frontend Communication
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter for Standard Error Payloads
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SentinelAI API Documentation')
    .setDescription('Core Backend API Service for AI Governance & Security Control Layer Platform')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Bearer JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('System Health', 'System status and operational readiness endpoints')
    .addTag('Authentication', 'User registration, login, session validation')
    .addTag('Users', 'User profile management and RBAC role assignment')
    .addTag('Agents', 'AI Agent registration, status & capability bindings')
    .addTag('Tools', 'Tool capabilities registry & sensitivity risk configuration')
    .addTag('Policies', 'Security policy definitions & enforcement rules')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`==========================================================`);
  logger.log(`🚀 SentinelAI Backend API is running on: http://localhost:${port}`);
  logger.log(`📚 Interactive Swagger Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`==========================================================`);
}

bootstrap();
