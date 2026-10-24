-- Traffixr · Phase 2 · Team members can see each other's names
-- Writers need reviewer and assignee names on their article pages. Profiles
-- only hold full_name, role and is_active, so letting every active user read
-- them is safe. Writes stay admin-only (admin_all policy).

create policy "team_read_profiles" on public.profiles
  for select to authenticated
  using (public.is_active_user());
