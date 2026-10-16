-- Run in Supabase SQL Editor for project mbpfaciehluwtxvfkohs.
-- Category-only update; safe to run repeatedly.
begin;

insert into public.software_categories
  (key, label, parent_key, description, is_active, sort_order)
values
  ('simlab', 'SimLab', 'hm', 'SimLab 前處理、網格建構、模型設定與分析相關問題', true, 30)
on conflict (key) do update set
  label = excluded.label,
  parent_key = excluded.parent_key,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

update public.software_categories
set description = '包含 HyperMesh、OptiStruct、SimLab 相關的除錯、設定與分析問題'
where key = 'hm';

commit;
