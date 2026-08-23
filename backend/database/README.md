# SentinelAI Database

The backend uses Supabase REST APIs through `@supabase/supabase-js`. The migration in `migrations/` creates the Semester 5 foundation tables, relationships, indexes, and development seed data.

## Required backend values

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL`: Supabase project URL from Project Settings > API.
- `SUPABASE_SERVICE_ROLE_KEY`: backend-only secret from Project Settings > API. Never expose this to a browser or commit it.
- `JWT_SECRET`: application JWT signing secret.

`DATABASE_URL` is optional and is only for direct PostgreSQL tooling. The NestJS runtime uses Supabase APIs, not this connection string.

## Apply the migration

1. Install the Supabase CLI.
2. Run `supabase login`.
3. Run `supabase link --project-ref YOUR_PROJECT_REF` from `backend/`.
4. Run `supabase db push`.
5. Start the API with `npm run start:dev`.

The seeded development administrator is `admin@sentinelai.io` with password `AdminPass123!`. Change or remove development seed credentials before production use.
