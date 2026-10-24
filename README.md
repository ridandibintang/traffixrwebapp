# Traffixr

Internal SEO operations app for the Traffixr team (1 admin, 2 writers). Built in phases; this repository is at **Phase 0: Foundation**.

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui
- Supabase: PostgreSQL, Auth (email + password), Row Level Security
- Two roles stored in `profiles.role`: `admin` and `writer`

## Setup

1. **Create a Supabase project** at supabase.com (free tier is enough).

2. **Environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the project URL, publishable key, and secret key from *Project Settings > API Keys*. Set `SEED_PASSWORD` to the password the three seed accounts will use.

3. **Apply the database migrations** (schema, triggers, RLS). Either:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npm run db:push
   ```

   or paste the three files in `supabase/migrations/` into the SQL Editor in order.

4. **Seed users and the first client**

   ```bash
   npm run db:seed
   ```

   Creates `admin@traffixr.test` (Bintang, admin), `aura@traffixr.test` and `hamzah@traffixr.test` (writers), and the client Jatis Mobile. Emails can be changed in `.env.local` before seeding.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Sign in as the admin to see the sidebar and dashboard; sign in as a writer to see the single-page writer view.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply `supabase/migrations/*` to the linked project |
| `npm run db:seed` | Create seed users and client (idempotent) |
| `npm run db:types` | Regenerate `lib/types/database.ts` from the linked project |

## Project structure

```
app/
  (auth)/login/        sign-in page + server action
  (app)/               everything behind auth; layout picks the shell by role
    dashboard/         admin home
    my-articles/       writer home
    clients|content|audits|off-page|reports/   placeholders until their phase
  auth/signout/        route handler that ends the session
components/
  ui/                  shadcn/ui
  layout/              admin sidebar, writer header, shared page pieces
lib/
  supabase/            browser client, server client, proxy session refresh
  auth.ts              getCurrentUser(), requireAdmin()
  types/database.ts    Database type (hand-written for Phase 0, generated later)
supabase/migrations/   0001 schema · 0002 functions & triggers · 0003 RLS
scripts/seed.ts        seed users + client via the secret key
proxy.ts               session refresh + redirect to /login
```

## Access rules (enforced by RLS)

| Data | Admin | Writer |
| --- | --- | --- |
| Clients and client context | Read, write | Read all |
| Cycles, tasks, templates, keywords, audits, backlinks, GBP, metrics, reports | Read, write | No access |
| Content briefs | Read, write | Read briefs attached to own articles |
| Articles | Read, write | Read own; update draft link, publish URL, own status lane |
| Article comments and reviews | Read, write | Own articles only |

## Next

Phase 1: client profiles and context, two-week cycles, task boards, task templates, backlink log, GBP schedule, cross-client dashboard.
