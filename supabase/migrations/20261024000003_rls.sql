-- Traffixr · Phase 0 · Row Level Security
-- Mirrors the "Hak akses" table of the blueprint:
--   admin  : full access to everything
--   writer : read all clients (profile + context); read briefs of own
--            articles; read/update own articles; read/write comments on own
--            articles; read own reviews; nothing else.
-- Every policy requires an active profile, so deactivating a user in
-- profiles.is_active locks them out even while their session is valid.

-- ---------------------------------------------------------------------------
-- Enable RLS on every table (no policy = no access for anon/authenticated)
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.clients              enable row level security;
alter table public.cycles               enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_templates       enable row level security;
alter table public.keyword_clusters     enable row level security;
alter table public.keywords             enable row level security;
alter table public.content_briefs       enable row level security;
alter table public.brief_competitors    enable row level security;
alter table public.brief_internal_links enable row level security;
alter table public.brief_outline_items  enable row level security;
alter table public.articles             enable row level security;
alter table public.article_reviews      enable row level security;
alter table public.comments             enable row level security;
alter table public.audits               enable row level security;
alter table public.audit_findings       enable row level security;
alter table public.issue_rules          enable row level security;
alter table public.backlinks            enable row level security;
alter table public.gbp_posts            enable row level security;
alter table public.metric_snapshots     enable row level security;
alter table public.reports              enable row level security;
alter table public.activity_log         enable row level security;

-- ---------------------------------------------------------------------------
-- Admin: full access on every table
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'cycles', 'tasks', 'task_templates',
    'keyword_clusters', 'keywords', 'content_briefs', 'brief_competitors',
    'brief_internal_links', 'brief_outline_items', 'articles',
    'article_reviews', 'comments', 'audits', 'audit_findings', 'issue_rules',
    'backlinks', 'gbp_posts', 'metric_snapshots', 'reports', 'activity_log'
  ]
  loop
    execute format(
      'create policy "admin_all" on public.%I
         for all to authenticated
         using (public.is_admin())
         with check (public.is_admin())',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Writer policies
-- ---------------------------------------------------------------------------

-- profiles: everyone can read their own row (needed to know their role)
create policy "self_read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- clients: writers see every client, profile and context included
create policy "writer_read_clients" on public.clients
  for select to authenticated
  using (public.is_active_user());

-- articles: writers see and update only articles assigned to them.
-- Column-level limits are enforced by the protect_article_from_writer trigger.
create policy "writer_read_own_articles" on public.articles
  for select to authenticated
  using (public.is_active_user() and writer_id = (select auth.uid()));

create policy "writer_update_own_articles" on public.articles
  for update to authenticated
  using (public.is_active_user() and writer_id = (select auth.uid()))
  with check (writer_id = (select auth.uid()));

-- content_briefs (+ children): readable when attached to one of the writer's articles
create policy "writer_read_assigned_briefs" on public.content_briefs
  for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.articles a
      where a.brief_id = content_briefs.id
        and a.writer_id = (select auth.uid())
    )
  );

create policy "writer_read_assigned_brief_competitors" on public.brief_competitors
  for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.articles a
      where a.brief_id = brief_competitors.brief_id
        and a.writer_id = (select auth.uid())
    )
  );

create policy "writer_read_assigned_brief_links" on public.brief_internal_links
  for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.articles a
      where a.brief_id = brief_internal_links.brief_id
        and a.writer_id = (select auth.uid())
    )
  );

create policy "writer_read_assigned_brief_outline" on public.brief_outline_items
  for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.articles a
      where a.brief_id = brief_outline_items.brief_id
        and a.writer_id = (select auth.uid())
    )
  );

-- article_reviews: writers read the review history of their own articles
create policy "writer_read_own_reviews" on public.article_reviews
  for select to authenticated
  using (
    public.is_active_user()
    and exists (
      select 1 from public.articles a
      where a.id = article_reviews.article_id
        and a.writer_id = (select auth.uid())
    )
  );

-- comments: writers read and write comments on their own articles only
create policy "writer_read_own_article_comments" on public.comments
  for select to authenticated
  using (
    public.is_active_user()
    and entity_type = 'article'
    and exists (
      select 1 from public.articles a
      where a.id = comments.entity_id
        and a.writer_id = (select auth.uid())
    )
  );

create policy "writer_write_own_article_comments" on public.comments
  for insert to authenticated
  with check (
    public.is_active_user()
    and author_id = (select auth.uid())
    and entity_type = 'article'
    and exists (
      select 1 from public.articles a
      where a.id = comments.entity_id
        and a.writer_id = (select auth.uid())
    )
  );

-- activity_log: any active user may record their own actions; only admins read
create policy "user_insert_own_activity" on public.activity_log
  for insert to authenticated
  with check (public.is_active_user() and actor_id = (select auth.uid()));
