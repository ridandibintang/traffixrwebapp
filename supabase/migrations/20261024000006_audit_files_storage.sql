-- Traffixr · Phase 3 · Storage for Screaming Frog exports
-- Original CSV files are kept in a private bucket; only admins touch them.
-- Paths: {client_id}/{audit_id}/{filename}

insert into storage.buckets (id, name, public, file_size_limit)
values ('audit-files', 'audit-files', false, 52428800) -- 50 MB per file
on conflict (id) do nothing;

create policy "admin_audit_files" on storage.objects
  for all to authenticated
  using (bucket_id = 'audit-files' and public.is_admin())
  with check (bucket_id = 'audit-files' and public.is_admin());

-- Grouping and comparison read findings by audit and state.
create index audit_findings_audit_state_idx on public.audit_findings (audit_id, state);
