-- AI mentor suggestion history.
-- Run this in Supabase SQL Editor before enabling AI suggestion persistence.

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('student', 'lesson_plan', 'block', 'lesson_record')),
  target_id uuid not null,
  mentor_type text not null default 'general' check (mentor_type in ('body', 'communication', 'lesson_design', 'general')),
  prompt text not null,
  response text not null,
  source_summary text,
  created_at timestamptz not null default now()
);

alter table public.ai_suggestions enable row level security;

drop policy if exists "ai suggestions are owned by user" on public.ai_suggestions;
create policy "ai suggestions are owned by user" on public.ai_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ai_suggestions_user_target_idx
  on public.ai_suggestions(user_id, target_type, target_id, created_at desc);
