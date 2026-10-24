-- Traffixr · Phase 1 · Tasks generated from templates
-- A template produces one task per period (cycle, ISO week, or month). The
-- unique index makes generation idempotent: re-running the sync never
-- duplicates a task.

alter table public.tasks
  add column template_id uuid references public.task_templates (id) on delete set null,
  add column period_key  text;

comment on column public.tasks.period_key is
  'Period a template task belongs to: cycle id for per_cycle, YYYY-Www for weekly, YYYY-MM for monthly.';

create unique index tasks_template_period_key on public.tasks (template_id, period_key);
