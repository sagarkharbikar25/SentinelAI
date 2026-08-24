import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public client: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(configService: ConfigService) {
    const url = configService.get<string>('SUPABASE_URL');
    const serviceRoleKey =
      configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      configService.get<string>('SUPABASE_SECRET_KEY');

    const isPlaceholder =
      !url ||
      !serviceRoleKey ||
      url.includes('your-project-ref') ||
      serviceRoleKey.includes('your-supabase-service-role');

    if (isPlaceholder) {
      this.client = null;
      this.logger.warn(
        'Supabase is using local mock repository. Set valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to connect live cloud DB.',
      );
      return;
    }

    try {
      this.client = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      this.logger.log(`Supabase client successfully initialized for: ${url}`);
    } catch (err: any) {
      this.client = null;
      this.logger.error(
        `Supabase initialization failed: ${err?.message || err}. Falling back to mock data.`,
      );
    }
  }
}
