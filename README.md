# Traffixr

Internal SEO operations app for the Traffixr team (1 admin, 2 writers). Built in phases; this repository is at **Phase 1: Clients and cycles** (Phase 0 foundation plus client profiles, two-week cycles, task boards, task templates, backlink log, GBP post schedule, cross-client dashboard).

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
  (auth)/login/            sign-in page + server action
  (app)/                   everything behind auth; layout picks the shell by role
    dashboard/             cross-client dashboard (tasks due, meetings, off-page)
    clients/               client list, new/edit
      [clientId]/          layout with client header + tabs
        page.tsx           overview: profile, content context, cycles, backlog
        cycles/            new (with next-cycle handoff), [cycleId] board/list, edit
        tasks/             new, [taskId]/edit
        backlinks/         monthly backlink log
        gbp/               weekly GBP post schedule
    templates/             recurring task templates
    off-page/              backlinks this month + upcoming GBP posts, all clients
    my-articles/           writer home
    content|audits|reports/   placeholders until their phase
  auth/signout/            route handler that ends the session
components/
  ui/                      shadcn/ui (+ native-select)
  layout/                  admin sidebar, writer header, client tabs
  forms/                   one form component per entity (client, cycle, task, ...)
  tasks/                   board, list, card, filters, status select
  shared/                  field, submit/delete/link buttons, status badges
lib/
  actions/                 server actions per entity (zod-validated)
  queries/                 read helpers used by pages
  templates.ts             generate per-cycle tasks, sync weekly/monthly tasks
  dates.ts · labels.ts · form.ts   helpers
  supabase/                browser client, server client, proxy session refresh
  auth.ts                  getCurrentUser(), requireAdmin()
  types/database.ts        generated from Supabase (npm run db:types)
supabase/migrations/       0001 schema · 0002 functions & triggers · 0003 RLS · 0004 template tasks
scripts/seed.ts            seed users + client via the secret key
proxy.ts                   session refresh + redirect to /login
```

## How recurring tasks work

- **Every cycle** templates are copied into a cycle when it is created.
- **Weekly** and **monthly** templates are added to each active cycle the first time the dashboard or that cycle is opened in a new week or month. No scheduler is needed.
- A unique index on `(template_id, period_key)` makes this idempotent, so reloading never duplicates a task.
- When a cycle is closed, the next-cycle form offers to move unfinished manual tasks. Template tasks are not moved; the new cycle gets its own.

## Access rules (enforced by RLS)

| Data | Admin | Writer |
| --- | --- | --- |
| Clients and client context | Read, write | Read all |
| Cycles, tasks, templates, keywords, audits, backlinks, GBP, metrics, reports | Read, write | No access |
| Content briefs | Read, write | Read briefs attached to own articles |
| Articles | Read, write | Read own; update draft link, publish URL, own status lane |
| Article comments and reviews | Read, write | Own articles only |

## Next

Phase 2: keywords and clusters, brief import from JSON, 7-section brief form, .docx export, writer assignment, writer portal, review checklist, publish tracking.
