-- YOGA NURTURE initial schema
-- Run this file in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kana text,
  age_group text,
  gender text check (gender in ('female', 'male', 'other', 'prefer_not_to_say')),
  experience text,
  caution text,
  memo text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_observation_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_record_id uuid,
  lesson_title text,
  attendance_status text not null default 'present' check (attendance_status in ('present', 'cancelled', 'no_show')),
  condition text,
  memo text,
  next_follow text,
  observed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.block_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  icon text,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.block_subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.block_categories(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.block_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.block_categories(id) on delete set null,
  subcategory_id uuid references public.block_subcategories(id) on delete set null,
  name text not null,
  duration_minutes integer not null default 5,
  purpose text,
  level text,
  cautions text,
  script text,
  memo text,
  favorite boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.block_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.block_template_tags (
  block_template_id uuid not null references public.block_templates(id) on delete cascade,
  tag_id uuid not null references public.block_tags(id) on delete cascade,
  primary key (block_template_id, tag_id)
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  theme text,
  duration_minutes integer not null default 60,
  format text check (format in ('personal', 'group', 'online')),
  memo text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_plan_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  block_template_id uuid not null references public.block_templates(id) on delete restrict,
  sort_order integer not null default 0,
  planned_duration_minutes integer,
  script_override text,
  cautions_override text,
  created_at timestamptz not null default now(),
  unique (lesson_plan_id, sort_order)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_plan_id uuid references public.lesson_plans(id) on delete set null,
  lesson_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place text,
  format text check (format in ('personal', 'group', 'online')),
  status text not null default 'scheduled' check (status in ('scheduled', 'preparing', 'prepared', 'record_pending', 'recorded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_participants (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_status text not null default 'present' check (attendance_status in ('present', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, student_id)
);

create table if not exists public.lesson_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  lesson_plan_id uuid references public.lesson_plans(id) on delete set null,
  lesson_name text not null,
  record_date date not null default current_date,
  overall_memo text,
  student_reaction text,
  improvement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_record_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_record_id uuid not null references public.lesson_records(id) on delete cascade,
  block_template_id uuid not null references public.block_templates(id) on delete restrict,
  sort_order integer not null default 0,
  done boolean not null default true,
  actual_duration_minutes integer,
  reaction text check (reaction in ('good', 'neutral', 'poor')),
  teacher_memo text,
  improvement_memo text,
  use_again boolean not null default true,
  script_revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_record_id, block_template_id)
);

create table if not exists public.lesson_record_students (
  id uuid primary key default gen_random_uuid(),
  lesson_record_id uuid not null references public.lesson_records(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_status text not null default 'present' check (attendance_status in ('present', 'cancelled', 'no_show')),
  condition text,
  memo text,
  next_follow text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_record_id, student_id)
);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.student_observation_notes enable row level security;
alter table public.block_categories enable row level security;
alter table public.block_subcategories enable row level security;
alter table public.block_templates enable row level security;
alter table public.block_tags enable row level security;
alter table public.block_template_tags enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_blocks enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_participants enable row level security;
alter table public.lesson_records enable row level security;
alter table public.lesson_record_blocks enable row level security;
alter table public.lesson_record_students enable row level security;

drop policy if exists "profiles are owned by user" on public.profiles;
create policy "profiles are owned by user" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "students are owned by user" on public.students;
create policy "students are owned by user" on public.students
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "student notes are owned by user" on public.student_observation_notes;
create policy "student notes are owned by user" on public.student_observation_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block categories are owned by user" on public.block_categories;
create policy "block categories are owned by user" on public.block_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block subcategories are owned by user" on public.block_subcategories;
create policy "block subcategories are owned by user" on public.block_subcategories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block templates are owned by user" on public.block_templates;
create policy "block templates are owned by user" on public.block_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block tags are owned by user" on public.block_tags;
create policy "block tags are owned by user" on public.block_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block template tags follow block owner" on public.block_template_tags;
create policy "block template tags follow block owner" on public.block_template_tags
  for all using (
    exists (
      select 1 from public.block_templates b
      where b.id = block_template_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.block_templates b
      join public.block_tags t on t.id = tag_id
      where b.id = block_template_id
        and b.user_id = auth.uid()
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "lesson plans are owned by user" on public.lesson_plans;
create policy "lesson plans are owned by user" on public.lesson_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lesson plan blocks follow plan owner" on public.lesson_plan_blocks;
create policy "lesson plan blocks follow plan owner" on public.lesson_plan_blocks
  for all using (
    exists (
      select 1 from public.lesson_plans p
      where p.id = lesson_plan_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.lesson_plans p
      join public.block_templates b on b.id = block_template_id
      where p.id = lesson_plan_id
        and p.user_id = auth.uid()
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "schedules are owned by user" on public.schedules;
create policy "schedules are owned by user" on public.schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "schedule participants follow schedule owner" on public.schedule_participants;
create policy "schedule participants follow schedule owner" on public.schedule_participants
  for all using (
    exists (
      select 1 from public.schedules s
      where s.id = schedule_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.schedules s
      join public.students st on st.id = student_id
      where s.id = schedule_id
        and s.user_id = auth.uid()
        and st.user_id = auth.uid()
    )
  );

drop policy if exists "lesson records are owned by user" on public.lesson_records;
create policy "lesson records are owned by user" on public.lesson_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lesson record blocks follow record owner" on public.lesson_record_blocks;
create policy "lesson record blocks follow record owner" on public.lesson_record_blocks
  for all using (
    exists (
      select 1 from public.lesson_records r
      where r.id = lesson_record_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.lesson_records r
      join public.block_templates b on b.id = block_template_id
      where r.id = lesson_record_id
        and r.user_id = auth.uid()
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "lesson record students follow record owner" on public.lesson_record_students;
create policy "lesson record students follow record owner" on public.lesson_record_students
  for all using (
    exists (
      select 1 from public.lesson_records r
      where r.id = lesson_record_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.lesson_records r
      join public.students st on st.id = student_id
      where r.id = lesson_record_id
        and r.user_id = auth.uid()
        and st.user_id = auth.uid()
    )
  );

create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists student_observation_notes_student_id_idx on public.student_observation_notes(student_id);
create index if not exists block_templates_user_id_idx on public.block_templates(user_id);
create index if not exists lesson_plans_user_id_idx on public.lesson_plans(user_id);
create index if not exists schedules_user_id_starts_at_idx on public.schedules(user_id, starts_at);
create index if not exists lesson_records_user_id_record_date_idx on public.lesson_records(user_id, record_date);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists student_observation_notes_set_updated_at on public.student_observation_notes;
create trigger student_observation_notes_set_updated_at before update on public.student_observation_notes
  for each row execute function public.set_updated_at();

drop trigger if exists block_categories_set_updated_at on public.block_categories;
create trigger block_categories_set_updated_at before update on public.block_categories
  for each row execute function public.set_updated_at();

drop trigger if exists block_subcategories_set_updated_at on public.block_subcategories;
create trigger block_subcategories_set_updated_at before update on public.block_subcategories
  for each row execute function public.set_updated_at();

drop trigger if exists block_templates_set_updated_at on public.block_templates;
create trigger block_templates_set_updated_at before update on public.block_templates
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_plans_set_updated_at on public.lesson_plans;
create trigger lesson_plans_set_updated_at before update on public.lesson_plans
  for each row execute function public.set_updated_at();

drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at before update on public.schedules
  for each row execute function public.set_updated_at();

drop trigger if exists schedule_participants_set_updated_at on public.schedule_participants;
create trigger schedule_participants_set_updated_at before update on public.schedule_participants
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_records_set_updated_at on public.lesson_records;
create trigger lesson_records_set_updated_at before update on public.lesson_records
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_record_blocks_set_updated_at on public.lesson_record_blocks;
create trigger lesson_record_blocks_set_updated_at before update on public.lesson_record_blocks
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_record_students_set_updated_at on public.lesson_record_students;
create trigger lesson_record_students_set_updated_at before update on public.lesson_record_students
  for each row execute function public.set_updated_at();
