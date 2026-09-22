-- CAE Knowledge Base — initial schema + seed
-- Paste into Supabase SQL Editor, or run via `supabase db push` if CLI linked.

create extension if not exists "pgcrypto";

-- Categories (dynamic; initial seed HyperMesh / LS-DYNA)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Knowledge entries
create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.categories (id) on delete set null,
  symptom text not null default '',
  root_cause text not null default '',
  solution text not null default '',
  failed_attempts text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  deleted_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_entries_category_idx on public.knowledge_entries (category_id);
create index if not exists knowledge_entries_deleted_idx on public.knowledge_entries (deleted_at);
create index if not exists knowledge_entries_favorite_idx on public.knowledge_entries (is_favorite) where deleted_at is null;
create index if not exists knowledge_entries_viewed_idx on public.knowledge_entries (last_viewed_at desc nulls last);

-- Image metadata (files live in Storage bucket `knowledge-images`)
create table if not exists public.knowledge_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_images_entry_idx on public.knowledge_images (entry_id, sort_order);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists knowledge_entries_set_updated_at on public.knowledge_entries;
create trigger knowledge_entries_set_updated_at
  before update on public.knowledge_entries
  for each row execute function public.set_updated_at();

-- Shared department access (no auth): open RLS with anon policies
alter table public.categories enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.knowledge_images enable row level security;

drop policy if exists "categories_all" on public.categories;
create policy "categories_all" on public.categories for all using (true) with check (true);

drop policy if exists "entries_all" on public.knowledge_entries;
create policy "entries_all" on public.knowledge_entries for all using (true) with check (true);

drop policy if exists "images_all" on public.knowledge_images;
create policy "images_all" on public.knowledge_images for all using (true) with check (true);

-- Storage bucket (public read for shared tool; write via anon for dept use)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-images',
  'knowledge-images',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "knowledge_images_select" on storage.objects;
create policy "knowledge_images_select" on storage.objects
  for select using (bucket_id = 'knowledge-images');

drop policy if exists "knowledge_images_insert" on storage.objects;
create policy "knowledge_images_insert" on storage.objects
  for insert with check (bucket_id = 'knowledge-images');

drop policy if exists "knowledge_images_update" on storage.objects;
create policy "knowledge_images_update" on storage.objects
  for update using (bucket_id = 'knowledge-images') with check (bucket_id = 'knowledge-images');

drop policy if exists "knowledge_images_delete" on storage.objects;
create policy "knowledge_images_delete" on storage.objects
  for delete using (bucket_id = 'knowledge-images');

-- Seed categories
insert into public.categories (id, name, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'HyperMesh', 1),
  ('22222222-2222-2222-2222-222222222222', 'LS-DYNA', 2)
on conflict (name) do nothing;

-- Seed demo entries
insert into public.knowledge_entries (
  id, title, category_id, symptom, root_cause, solution, failed_attempts, tags, is_favorite, created_at, updated_at, last_viewed_at
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '小孔 Washer 網格外圈不規則',
  '11111111-1111-1111-1111-111111111111',
  '小孔 washer 外圈出現不規則三角／四邊形，局部長寬比與翹曲超標，影響後續接觸定義。',
  '孔邊與 washer 間距過近，batchmesh 無法維持目標尺寸與圓周對稱；washer 層數不足。',
  '提高 washer 層數（≥2），縮小目標尺寸至孔徑 1/6～1/8，啟用 circular pattern / washer bias，並在局部用 remesh 清理。',
  '單純縮小全局 size、只開 quad-dominant 而未補 washer 層，問題仍存在。',
  array['washer', '小孔', 'batchmesh', 'HyperMesh', '網格品質'],
  true,
  now() - interval '2 days',
  now() - interval '1 day',
  now() - interval '3 hours'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '幾何補面',
  '11111111-1111-1111-1111-111111111111',
  'CAD 匯入後出現破面、縫隙，無法產生封閉 mid-surface 或 solid map。',
  'STEP/IGES 公差與特徵刪除造成面不連續；小倒角與薄壁被簡化後留下 gap。',
  '使用 Geom > Quick Edit / Surface Edit 補面，統一 tolerance，必要時 rebuild edges 再 mid-surface。',
  '直接 Ignore gaps 進入 mesh，後續接觸與厚度計算失真。',
  array['補面', 'geometry', 'STEP', 'HyperMesh'],
  false,
  now() - interval '5 days',
  now() - interval '4 days',
  null
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'LS-DYNA 時間步長設定建議',
  '22222222-2222-2222-2222-222222222222',
  '顯式分析時間步長過小導致 runtime 過長，或過大觸發負體積／不穩定。',
  '最小單元特徵長度與材料波速決定臨界 dt；局部細網與剛性材料主導。',
  '檢查 d3hsp 中最小 dt 單元，局部放寬 mesh；合理使用質量縮放（MSS）並監控質量增加比例；控制接觸罰參數。',
  '盲目提高 TSSFAC、全面質量縮放導致能量比異常。',
  array['timestep', 'MSS', 'LS-DYNA', '穩定性'],
  false,
  now() - interval '8 days',
  now() - interval '6 days',
  now() - interval '1 day'
)
on conflict (id) do nothing;
