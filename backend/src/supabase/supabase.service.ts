import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient | null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(configService: ConfigService) {
    const url = configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      this.client = null;
      this.logger.warn('Supabase is disabled. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable database persistence.');
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
