-- Traffixr · Phase 0 · Functions and triggers
-- 1. updated_at maintenance for every table
-- 2. Auto-create a profile when an auth user is created
-- 3. Role helpers used by RLS policies
-- 4. Guard: writers may only touch their own lane of an article

-- ---------------------------------------------------------------------------
-- 1. updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Profile auto-creation
--    Role and name can be passed in auth user metadata (used by the seed
--    script). A user created without metadata becomes an active writer; only
--    an admin can promote someone to admin afterwards.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when requested_role in ('admin', 'writer')
         then requested_role::public.user_role
         else 'writer'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Role helpers (security definer so they bypass RLS on profiles and
--    never recurse into the profiles policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active
  );
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_active_user() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Article guard for writers
--    RLS decides WHICH rows a writer can update (their own). This trigger
--    decides WHAT they can change: draft link, submission, publish URL, and a
--    forward-only status move inside their lane. Everything else is admin-only.
-- ---------------------------------------------------------------------------
create or replace function public.protect_article_from_writer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.client_id  is distinct from old.client_id
     or new.brief_id    is distinct from old.brief_id
     or new.writer_id   is distinct from old.writer_id
     or new.cycle_id    is distinct from old.cycle_id
     or new.title       is distinct from old.title
     or new.due_date    is distinct from old.due_date
     or new.approved_at is distinct from old.approved_at then
    raise exception 'Writers can only update draft_url, published_url and their own status lane';
  end if;

  if new.status is distinct from old.status
     and new.status not in ('writing', 'submitted', 'published') then
    raise exception 'Writers can only move an article to writing, submitted or published';
  end if;

  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at = now();
  end if;
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = coalesce(new.published_at, now());
  end if;

  return new;
end;
$$;

create trigger protect_article_from_writer
  before update on public.articles
  for each row execute function public.protect_article_from_writer();
