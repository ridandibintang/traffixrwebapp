-- Traffixr · Phase 0 · Schema
-- All tables from the blueprint "Model data" section. Every table has
-- id uuid, created_at, updated_at. Status-like columns are PostgreSQL enums.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'writer');
create type public.client_status as enum ('active', 'paused', 'ended');
create type public.cycle_status as enum ('planning', 'active', 'review', 'closed');
create type public.task_category as enum (
  'on_page', 'technical', 'content', 'keyword_research', 'off_page', 'gbp', 'reporting', 'other'
);
create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('todo', 'in_progress', 'done', 'blocked', 'wont_do');
create type public.task_source as enum ('manual', 'audit', 'template');
create type public.template_frequency as enum ('per_cycle', 'weekly', 'monthly');
create type public.page_type as enum ('blog', 'landing', 'service');
create type public.search_intent as enum ('informational', 'navigational', 'commercial', 'transactional');
create type public.keyword_source as enum ('manual', 'dataforseo', 'se_ranking');
create type public.brief_status as enum ('draft', 'ready', 'archived');
create type public.outline_level as enum ('h1', 'h2', 'h3');
create type public.article_status as enum (
  'draft', 'assigned', 'writing', 'submitted', 'in_review', 'revision', 'approved', 'published'
);
create type public.review_decision as enum ('approve', 'revise');
create type public.comment_entity as enum ('content_brief', 'article');
create type public.audit_type as enum ('on_page', 'technical');
create type public.finding_severity as enum ('low', 'medium', 'high', 'critical');
create type public.finding_state as enum ('new', 'persisting', 'fixed');
create type public.finding_status as enum ('open', 'converted', 'ignored');
create type public.backlink_status as enum ('planned', 'ordered', 'live', 'lost');
create type public.gbp_post_type as enum ('update', 'offer', 'event');
create type public.gbp_post_status as enum ('draft', 'scheduled', 'published');
create type public.metric_source as enum ('gsc', 'ga4');
create type public.dimension_type as enum ('total', 'query', 'page');
create type public.report_status as enum ('draft', 'final');

-- ---------------------------------------------------------------------------
-- Backbone: profiles, clients, cycles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        public.user_role not null default 'writer',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user, created by trigger on auth.users insert.';

create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  website_url   text not null,
  cms           text,
  industry      text,
  status        public.client_status not null default 'active',
  started_at    date,
  -- Content context (replaces Claude Project Instructions)
  audience      text,
  brand_voice   text,
  services      jsonb not null default '[]'::jsonb,  -- [{ "name": "...", "url": "..." }]
  key_pages     jsonb not null default '[]'::jsonb,  -- [{ "title": "...", "url": "..." }]
  client_notes  text,
  gbp_url       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index clients_website_url_key on public.clients (lower(website_url));
create index clients_status_idx on public.clients (status);

create table public.cycles (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients (id) on delete cascade,
  number        integer not null,
  start_date    date not null,
  end_date      date not null,
  meeting_date  date,
  status        public.cycle_status not null default 'planning',
  summary       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint cycles_client_number_key unique (client_id, number),
  constraint cycles_dates_check check (end_date >= start_date)
);
create index cycles_client_status_idx on public.cycles (client_id, status);

-- ---------------------------------------------------------------------------
-- Audit work: audits, tasks, task_templates, issue_rules, audit_findings
-- ---------------------------------------------------------------------------
create table public.audits (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  cycle_id    uuid references public.cycles (id) on delete set null,
  type        public.audit_type not null,
  crawl_date  date not null default current_date,
  file_paths  text[] not null default '{}',
  total_urls  integer,
  summary     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index audits_client_crawl_idx on public.audits (client_id, crawl_date desc);
create index audits_cycle_idx on public.audits (cycle_id);

create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  cycle_id       uuid references public.cycles (id) on delete set null,
  title          text not null,
  description    text,
  category       public.task_category not null default 'other',
  priority       public.priority_level not null default 'medium',
  status         public.task_status not null default 'todo',
  assignee_id    uuid references public.profiles (id) on delete set null,
  due_date       date,
  source         public.task_source not null default 'manual',
  audit_id       uuid references public.audits (id) on delete set null,
  affected_urls  text[] not null default '{}',
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index tasks_client_status_idx on public.tasks (client_id, status);
create index tasks_cycle_idx on public.tasks (cycle_id);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_audit_idx on public.tasks (audit_id);

create table public.task_templates (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid references public.clients (id) on delete cascade, -- null = all clients
  title                text not null,
  category             public.task_category not null default 'other',
  frequency            public.template_frequency not null default 'per_cycle',
  default_assignee_id  uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index task_templates_client_idx on public.task_templates (client_id);

create table public.issue_rules (
  id                   uuid primary key default gen_random_uuid(),
  issue_name           text not null unique,
  category             public.task_category not null default 'technical',
  default_severity     public.finding_severity not null default 'medium',
  task_title_template  text,
  ignore_by_default    boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.audit_findings (
  id          uuid primary key default gen_random_uuid(),
  audit_id    uuid not null references public.audits (id) on delete cascade,
  issue_name  text not null,
  category    public.task_category,
  severity    public.finding_severity not null default 'medium',
  url         text not null,
  details     jsonb not null default '{}'::jsonb,
  state       public.finding_state not null default 'new',
  status      public.finding_status not null default 'open',
  task_id     uuid references public.tasks (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index audit_findings_audit_issue_idx on public.audit_findings (audit_id, issue_name);
create index audit_findings_task_idx on public.audit_findings (task_id);
create index audit_findings_url_idx on public.audit_findings (url);

-- ---------------------------------------------------------------------------
-- Content pipeline: keyword_clusters, keywords, content_briefs (+3 children),
-- articles, article_reviews, comments
-- ---------------------------------------------------------------------------
create table public.keyword_clusters (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  name        text not null,
  intent      public.search_intent,
  page_type   public.page_type,
  target_url  text,
  priority    public.priority_level not null default 'medium',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index keyword_clusters_client_idx on public.keyword_clusters (client_id);

create table public.keywords (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  cluster_id     uuid references public.keyword_clusters (id) on delete set null,
  keyword        text not null,
  search_volume  integer,
  difficulty     numeric(5, 2),
  cpc            numeric(10, 2),
  intent         public.search_intent,
  source         public.keyword_source not null default 'manual',
  fetched_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint keywords_client_keyword_key unique (client_id, keyword)
);
create index keywords_cluster_idx on public.keywords (cluster_id);

create table public.content_briefs (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references public.clients (id) on delete cascade,
  keyword_id              uuid references public.keywords (id) on delete set null,
  target_keyword          text not null,
  -- 1. Fundamentals
  objective               text,
  search_intent           public.search_intent,
  intent_reason           text,
  target_audience         text,
  word_count_min          integer,
  word_count_max          integer,
  -- 2. Meta data
  meta_title              text,
  meta_description        text,
  -- 3. Gap analysis (competitor list lives in brief_competitors)
  content_gaps            text,
  -- 6. Writing best practices
  writing_best_practices  text,
  -- 7. Conclusion & CTA
  conclusion_notes        text,
  cta_copy                text,
  status                  public.brief_status not null default 'draft',
  docx_path               text,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint content_briefs_word_count_check
    check (word_count_min is null or word_count_max is null or word_count_max >= word_count_min)
);
create index content_briefs_client_status_idx on public.content_briefs (client_id, status);
create index content_briefs_keyword_idx on public.content_briefs (keyword_id);

create table public.brief_competitors (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references public.content_briefs (id) on delete cascade,
  position    integer not null,
  domain      text not null,
  page_title  text,
  url         text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint brief_competitors_position_key unique (brief_id, position)
);

create table public.brief_internal_links (
  id              uuid primary key default gen_random_uuid(),
  brief_id        uuid not null references public.content_briefs (id) on delete cascade,
  position        integer not null,
  url             text not null,
  anchor_text     text not null,
  placement_note  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint brief_internal_links_position_key unique (brief_id, position)
);

create table public.brief_outline_items (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references public.content_briefs (id) on delete cascade,
  position    integer not null,
  level       public.outline_level not null default 'h2',
  heading     text not null,
  key_points  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint brief_outline_items_position_key unique (brief_id, position)
);

create table public.articles (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  brief_id       uuid references public.content_briefs (id) on delete set null,
  writer_id      uuid references public.profiles (id) on delete set null,
  cycle_id       uuid references public.cycles (id) on delete set null,
  title          text not null,
  status         public.article_status not null default 'draft',
  due_date       date,
  draft_url      text,  -- Google Docs link
  submitted_at   timestamptz,
  approved_at    timestamptz,
  published_url  text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index articles_client_status_idx on public.articles (client_id, status);
create index articles_writer_status_idx on public.articles (writer_id, status);
create index articles_brief_idx on public.articles (brief_id);
create index articles_cycle_idx on public.articles (cycle_id);

create table public.article_reviews (
  id              uuid primary key default gen_random_uuid(),
  article_id      uuid not null references public.articles (id) on delete cascade,
  reviewer_id     uuid references public.profiles (id) on delete set null,
  round           integer not null default 1,
  intent_ok       boolean not null default false,
  readability_ok  boolean not null default false,
  facts_ok        boolean not null default false,
  notes           text,
  decision        public.review_decision not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint article_reviews_round_key unique (article_id, round)
);

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  entity_type  public.comment_entity not null,
  entity_id    uuid not null,
  author_id    uuid references public.profiles (id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index comments_entity_idx on public.comments (entity_type, entity_id, created_at);

-- ---------------------------------------------------------------------------
-- Off-page, performance, reporting, audit trail
-- ---------------------------------------------------------------------------
create table public.backlinks (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  month          date not null,  -- first day of the month this backlink counts toward
  source_domain  text not null,
  source_url     text,
  target_url     text not null,
  anchor_text    text,
  cost           numeric(12, 2),
  status         public.backlink_status not null default 'planned',
  ordered_at     date,
  live_at        date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint backlinks_month_first_day_check check (extract(day from month) = 1)
);
create index backlinks_client_month_idx on public.backlinks (client_id, month);
create index backlinks_status_idx on public.backlinks (status);

create table public.gbp_posts (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.clients (id) on delete cascade,
  scheduled_date       date not null,
  post_type            public.gbp_post_type not null default 'update',
  title                text,
  body                 text,
  image_path           text,
  cta_url              text,
  status               public.gbp_post_status not null default 'draft',
  published_at         timestamptz,
  requested_by_client  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index gbp_posts_client_date_idx on public.gbp_posts (client_id, scheduled_date);

create table public.metric_snapshots (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  source           public.metric_source not null,
  period_start     date not null,
  period_end       date not null,
  dimension_type   public.dimension_type not null default 'total',
  dimension_value  text,  -- null for totals, query text or page URL otherwise
  metrics          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint metric_snapshots_period_check check (period_end >= period_start)
);
create index metric_snapshots_lookup_idx
  on public.metric_snapshots (client_id, source, period_start, period_end, dimension_type);

create table public.reports (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.clients (id) on delete cascade,
  cycle_id             uuid not null references public.cycles (id) on delete cascade,
  period_start         date not null,
  period_end           date not null,
  status               public.report_status not null default 'draft',
  done_summary         text,
  offpage_summary      text,
  performance_summary  text,
  next_plan            text,
  notes                text,
  pdf_path             text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint reports_cycle_key unique (cycle_id),
  constraint reports_period_check check (period_end >= period_start)
);
create index reports_client_idx on public.reports (client_id, period_start desc);

create table public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  entity_type  text not null,
  entity_id    uuid,
  action       text not null,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);
create index activity_log_actor_idx on public.activity_log (actor_id, created_at desc);
