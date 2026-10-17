-- Phase 5: additive content types. Apply separately when those columns should exist.
-- Prerequisites: schema.sql. Row access is defined only in supabase/privileges.sql.
-- No row updates, renames, table recreation, column removal or policy changes.
-- Existing rows keep content_type NULL and are interpreted as troubleshooting by the client.
begin;

alter table public.entries
  add column if not exists content_type text default null
    check (content_type in ('knowledge', 'troubleshooting')),
  add column if not exists summary text not null default '',
  add column if not exists technical_explanation text not null default '',
  add column if not exists procedure text not null default '',
  add column if not exists key_rules text not null default '',
  add column if not exists verification text not null default '';

-- Column-level INSERT and UPDATE for the six new fields only.
-- privileges.sql grants the same columns when they already exist. Neither file changes row policies.
grant insert (content_type, summary, technical_explanation, procedure, key_rules, verification)
  on public.entries to authenticated;
grant update (content_type, summary, technical_explanation, procedure, key_rules, verification)
  on public.entries to authenticated;

comment on column public.entries.content_type is
  'knowledge or troubleshooting; NULL means legacy troubleshooting. Inactive type fields may retain authored content.';
comment on column public.entries.procedure is 'Optional technical knowledge procedure; numbered text steps.';
comment on column public.entries.verification is 'Optional troubleshooting verification result.';

-- Refresh the REST API schema cache after the additive DDL becomes visible.
notify pgrst, 'reload schema';

commit;
