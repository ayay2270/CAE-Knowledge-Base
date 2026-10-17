-- CAE Knowledge Base — access policies and grants.
-- This file is the only source of truth for who can read or write the knowledge base.
-- Safe to re-run. It revokes this application's privileges on entries and software_categories
-- from anon and authenticated, then grants exactly the list below. Older Phase 2–5 grants
-- do not remain. It does not change privileges on other Supabase objects.
--
-- Run after supabase/schema.sql. phase5-content-types.sql may run before or after this file.
-- When those columns already exist, this file grants them. When phase 5 adds them later, that
-- file grants INSERT and UPDATE on only those six columns.
--
-- One owner. Anonymous users have no table privileges and no policies.
-- Any other signed-in account fails kb_is_owner().
-- id, user_id, created_at, updated_at, and views are not writable by the client.

begin;

create or replace function public.kb_is_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() = '76fbe155-0879-4687-910a-fda12add9c2f'::uuid
$$;

revoke all on function public.kb_is_owner() from public;
grant execute on function public.kb_is_owner() to authenticated;

revoke all on table public.entries from anon;
revoke all on table public.software_categories from anon;
revoke all on table public.entries from authenticated;
revoke all on table public.software_categories from authenticated;

-- Column GRANTs are stored separately from table GRANTs, so clear those too.
revoke all privileges (
  id, user_id, title, category, tags, symptom, root_cause, solution,
  failed_attempts, notes, reference_source, images, views, created_at, updated_at
) on table public.entries from authenticated;
revoke all privileges (
  key, label, parent_key, description, is_active, sort_order, created_at, updated_at
) on table public.software_categories from authenticated;

grant select, delete on table public.entries to authenticated;
grant select on table public.software_categories to authenticated;
grant insert (
  title, category, tags, symptom, root_cause, solution,
  failed_attempts, notes, reference_source, images
) on table public.entries to authenticated;
grant update (
  title, category, tags, symptom, root_cause, solution,
  failed_attempts, notes, reference_source, images
) on table public.entries to authenticated;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'entries' and column_name = 'content_type'
  ) then
    revoke all privileges (
      content_type, summary, technical_explanation, procedure, key_rules, verification
    ) on table public.entries from authenticated;
    grant insert (
      content_type, summary, technical_explanation, procedure, key_rules, verification
    ) on table public.entries to authenticated;
    grant update (
      content_type, summary, technical_explanation, procedure, key_rules, verification
    ) on table public.entries to authenticated;
  end if;
end $$;

drop policy if exists "entries_public_read" on public.entries;
drop policy if exists entries_author_insert on public.entries;
drop policy if exists entries_author_update on public.entries;
drop policy if exists entries_author_delete on public.entries;
drop policy if exists entries_owner_select on public.entries;
drop policy if exists entries_owner_insert on public.entries;
drop policy if exists entries_owner_update on public.entries;
drop policy if exists entries_owner_delete on public.entries;

create policy entries_owner_select on public.entries
  for select to authenticated
  using (public.kb_is_owner());

create policy entries_owner_insert on public.entries
  for insert to authenticated
  with check (public.kb_is_owner());

create policy entries_owner_update on public.entries
  for update to authenticated
  using (public.kb_is_owner())
  with check (public.kb_is_owner());

create policy entries_owner_delete on public.entries
  for delete to authenticated
  using (public.kb_is_owner());

drop policy if exists "software_categories_public_read" on public.software_categories;
drop policy if exists software_categories_owner_select on public.software_categories;

create policy software_categories_owner_select on public.software_categories
  for select to authenticated
  using (public.kb_is_owner());

drop policy if exists "kb_images_public_read" on storage.objects;
drop policy if exists kb_images_author_insert on storage.objects;
drop policy if exists kb_images_author_delete on storage.objects;
drop policy if exists kb_images_owner_select on storage.objects;
drop policy if exists kb_images_owner_insert on storage.objects;
drop policy if exists kb_images_owner_delete on storage.objects;

create policy kb_images_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'kb-images' and public.kb_is_owner());

create policy kb_images_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kb-images'
    and public.kb_is_owner()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy kb_images_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'kb-images' and public.kb_is_owner());

commit;
