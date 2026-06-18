alter table public.schedules
  add column if not exists schedule_caution text,
  add column if not exists schedule_memo text;
