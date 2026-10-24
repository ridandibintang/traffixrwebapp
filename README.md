# Traffixr

Internal SEO operations app for the Traffixr team (1 admin, 2 writers). Built in phases; this repository is at **Phase 4: Reporting** (Phases 0–3 plus GSC/GA4 metrics via CSV import or manual totals, two-week reports assembled automatically per cycle with editable narrative, and PDF export).

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

## Deployment

- Production: https://traffixrwebapp.vercel.app (Vercel project `traffixrwebapp`, team Traffixr, Hobby plan), deployed from the `main` branch of github.com/ridandibintang/traffixrwebapp. Every push to `main` redeploys.
- Vercel environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only. The secret key stays local (seed script).
- Supabase Auth site URL is set to the production address.
- Database changes ship with `npm run db:push` before or together with the code that needs them.
- Vercel request bodies are capped at 4.5 MB, so very large crawl uploads need a direct-to-Storage upload (not built yet).

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
        keywords/          clusters + keywords, CSV import
        briefs/            list, new (7-section form), import (JSON), [briefId] view/edit
        articles/          list, new, [articleId] detail with review + comments, edit
        audits/            crawl list, new (upload), [auditId] grouped findings + classify + convert
        backlinks/         monthly backlink log
        gbp/               weekly GBP post schedule
        metrics/           GSC/GA4 snapshot sets, import (CSV), manual totals
        reports/           cycle reports: list, [reportId] preview + narrative form
    templates/             recurring task templates
    content/               cross-client article pipeline + briefs ready to assign
    audits/                all crawls across clients; rules/ manages issue rules
    off-page/              backlinks this month + upcoming GBP posts, all clients
    my-articles/           writer portal: list, [articleId] brief + draft/submit/publish
    reports/               all reports across clients
  api/briefs/[briefId]/docx  Golden Standard .docx export
  api/reports/[reportId]/pdf report PDF export (@react-pdf/renderer)
  auth/signout/            route handler that ends the session
components/
  ui/                      shadcn/ui (+ native-select)
  layout/                  admin sidebar, writer header, client tabs
  forms/                   one form component per entity (client, cycle, task, ...)
  tasks/                   board, list, card, filters, status select
  shared/                  field, submit/delete/link buttons, status badges
lib/
  actions/                 server actions per entity (zod-validated); writer.ts is the writer lane
  queries/                 read helpers used by pages
  briefs/schema.ts         shared brief payload schema (form + JSON import) and saveBrief()
  briefs/docx.ts           Golden Standard .docx renderer (docx package)
  keywords/csv.ts          header-based keyword CSV parser (papaparse)
  audits/parse.ts          crawl export parser: Screaming Frog CSVs, Issues Overview, .xlsx audit workbooks (SheetJS)
  metrics/parse.ts         GSC (Dates/Queries/Pages) and GA4 (channels/landing pages) CSV parsers, EN + ID headers
  reports/assemble.ts      builds the four report sections from app data; autoSummaries() writes the narrative
  reports/pdf.tsx          report PDF document
  supabase/fetch-all.ts    pages through the 1000-row PostgREST limit
  markdown.ts              **bold** and "- " bullets, shared by web view and .docx
  templates.ts             generate per-cycle tasks, sync weekly/monthly tasks
  dates.ts · labels.ts · form.ts   helpers
  supabase/                browser client, server client, proxy session refresh
  auth.ts                  getCurrentUser(), requireAdmin()
  types/database.ts        generated from Supabase (npm run db:types)
supabase/migrations/       0001 schema · 0002 functions & triggers · 0003 RLS · 0004 template tasks · 0005 team reads profiles · 0006 audit-files storage bucket
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

## Content pipeline

1. **Keywords**: add by hand or import a CSV (needs a keyword column; volume, KD, CPC, intent, and cluster columns are picked up by header name). Group into clusters.
2. **Brief**: run the Golden Standard skill in Claude, then *Import JSON* on the client's Briefs tab, or write one in the 7-section form. *Export .docx* renders the same document the skill produces.
3. **Article**: *Create article* from a brief, assign a writer and due date. Status flow: Draft → Assigned → Writing → Submitted → In review → Revision/Approved → Published.
4. **Writer portal** (`/my-articles`): the writer reads the brief and client context, saves the Google Docs link, submits, reads review notes, resubmits, and finally pastes the published URL. RLS plus a database trigger keep writers inside that lane.
5. **Review**: on the article page, *Start review*, tick intent/readability/facts, add notes, then approve or request a revision. Every round is kept.

## Screaming Frog audits

1. Crawl the site, then either **Bulk Export > Issues > All** (one CSV per issue, for example `page_titles_duplicate.csv`, optionally plus **Reports > Issues Overview** for priorities) or build an **audit workbook (.xlsx)** with one sheet per topic. Workbook sheets may start with a title row and a note row; the app finds the header row by looking for a URL column (URL, Address, Redirecting URL, Page With The Link, Image URL, ...). An *Issue* or *Problem* column splits a sheet into finer groups ("Page Titles: Over 561px"). An *Issue Tracker* sheet (Issue, Priority, Detail Tab, ...) supplies severity suggestions, and its rows without a detail tab become site-level findings on the home page. Sheets named Summary, Inventory, Coverage or Notes are skipped.
2. On the client's **Audits** tab, *Import crawl*: pick type, cycle, crawl date, and select the files. Files are stored in the private `audit-files` bucket; every row becomes an `audit_findings` record. Columns are matched by header name, never by position. Reads page through PostgREST's 1000-row limit (`lib/supabase/fetch-all.ts`), so crawls with thousands of findings display completely.
3. The audit page groups findings per issue and matches them to **issue rules** (category, default severity, task title template, ignore by default). Unknown issues appear once under *Classify new issue types*; saving a rule applies to every later crawl.
4. Tick the issues that should become tasks, set priority and assignee, and *Create tasks*: one task per issue, in the audit's cycle, with every affected URL attached. Findings are marked converted and linked to the task.
5. Each new crawl is compared with the previous crawl of the same type for that client. Findings are marked **new** or **persisting**; findings that disappeared are copied into the new audit as **fixed**, so each crawl's fixed count is ready for the report. Persisting findings keep their task link.

Server actions accept up to 40 MB per upload (`experimental.serverActions.bodySizeLimit`), 20 MB per file.

## Metrics and reports

1. **Metrics** (client tab): import Search Console CSVs (`Dates.csv` gives period totals, `Queries.csv` and `Pages.csv` give top lists) and GA4 exports (traffic acquisition for organic totals, landing pages for top pages; the period is read from the file header). Or type the headline totals by hand. Everything lands in `metric_snapshots` keyed by source and period; re-importing a period replaces it. The same table shape will be filled by the APIs in Phase 5.
2. **Report** (cycle page → *Create report*): one report per cycle, period defaults to the cycle dates. Four sections are assembled live: work completed (done tasks, published articles, crawl issues fixed), off-page (backlinks live, GBP posts published), organic performance (this period vs the previous snapshot set, with deltas, top queries and pages), and the plan for the next cycle (its tasks, the content pipeline, upcoming GBP posts and backlinks).
3. The four summaries plus notes are auto-written from the numbers on creation and can be edited; *Regenerate summaries* overwrites them from current data. Mark the report *Final* after the meeting and *Export PDF* for the client.

## Next

Phase 5: DataForSEO for keywords, GSC and GA4 APIs for metrics, through a single adapter layer in `integrations/`.
