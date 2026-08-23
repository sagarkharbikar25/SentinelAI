import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ToolsModule } from './tools/tools.module';
import { AgentsModule } from './agents/agents.module';
import { PoliciesModule } from './policies/policies.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ToolsModule,
    AgentsModule,
    PoliciesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
