-- YN-001..005: immutable schedule plan snapshots, occurrence-based lesson records,
-- nullable evaluations, and atomic multi-table saves.

alter table public.schedules
  add column if not exists lesson_plan_name_snapshot text,
  add column if not exists lesson_plan_theme_snapshot text,
  add column if not exists lesson_plan_format_snapshot text,
  add column if not exists lesson_plan_memo_snapshot text,
  add column if not exists lesson_plan_duration_minutes_snapshot integer;

create table if not exists public.schedule_plan_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  lesson_plan_block_id uuid,
  block_template_id uuid,
  sort_order integer not null default 0,
  planned_duration_minutes integer,
  block_name_snapshot text not null,
  category_name_snapshot text,
  subcategory_name_snapshot text,
  purpose_snapshot text,
  level_snapshot text,
  script_snapshot text,
  cautions_snapshot text,
  memo_snapshot text,
  tags_snapshot text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_plan_items_schedule_sort_key unique (schedule_id, sort_order),
  constraint schedule_plan_items_duration_check check (planned_duration_minutes is null or planned_duration_minutes >= 0)
);

alter table public.schedule_plan_items enable row level security;

drop policy if exists "schedule plan items follow schedule owner" on public.schedule_plan_items;
create policy "schedule plan items follow schedule owner"
on public.schedule_plan_items
for all
to authenticated
using (
  exists (
    select 1
    from public.schedules s
    where s.id = schedule_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.schedules s
    where s.id = schedule_id
      and s.user_id = (select auth.uid())
  )
  and (
    block_template_id is null
    or exists (
      select 1
      from public.block_templates b
      where b.id = block_template_id
        and b.user_id = (select auth.uid())
    )
  )
);

grant select, insert, update, delete on table public.schedule_plan_items to authenticated, service_role;
revoke all on table public.schedule_plan_items from anon;

drop trigger if exists schedule_plan_items_set_updated_at on public.schedule_plan_items;
create trigger schedule_plan_items_set_updated_at
before update on public.schedule_plan_items
for each row execute function public.set_updated_at();

alter table public.lesson_record_blocks
  add column if not exists schedule_plan_item_id uuid references public.schedule_plan_items(id) on delete set null,
  add column if not exists item_source text not null default 'planned',
  add column if not exists display_name_snapshot text not null default '',
  add column if not exists category_name_snapshot text,
  add column if not exists subcategory_name_snapshot text,
  add column if not exists planned_duration_minutes integer,
  add column if not exists purpose_snapshot text,
  add column if not exists level_snapshot text,
  add column if not exists script_snapshot text,
  add column if not exists cautions_snapshot text;

alter table public.lesson_record_blocks
  drop constraint if exists lesson_record_blocks_lesson_record_id_block_template_id_key,
  drop constraint if exists lesson_record_blocks_item_source_check,
  drop constraint if exists lesson_record_blocks_planned_duration_check;

alter table public.lesson_record_blocks
  add constraint lesson_record_blocks_item_source_check
    check (item_source in ('planned', 'library', 'improvised')),
  add constraint lesson_record_blocks_planned_duration_check
    check (planned_duration_minutes is null or planned_duration_minutes >= 0);

alter table public.lesson_record_blocks
  alter column block_template_id drop not null,
  alter column done drop default,
  alter column done drop not null,
  alter column use_again drop default,
  alter column use_again drop not null;

create unique index if not exists lesson_record_blocks_record_plan_item_uidx
  on public.lesson_record_blocks(lesson_record_id, schedule_plan_item_id)
  where schedule_plan_item_id is not null;

create index if not exists schedule_plan_items_schedule_order_idx
  on public.schedule_plan_items(schedule_id, sort_order);

create index if not exists schedule_plan_items_template_idx
  on public.schedule_plan_items(block_template_id)
  where block_template_id is not null;

create index if not exists lesson_record_blocks_plan_item_idx
  on public.lesson_record_blocks(schedule_plan_item_id)
  where schedule_plan_item_id is not null;

create index if not exists lesson_plan_blocks_plan_order_idx
  on public.lesson_plan_blocks(lesson_plan_id, sort_order);

create index if not exists schedule_participants_schedule_idx
  on public.schedule_participants(schedule_id);

create index if not exists lesson_record_blocks_record_order_idx
  on public.lesson_record_blocks(lesson_record_id, sort_order);

create index if not exists lesson_record_students_record_idx
  on public.lesson_record_students(lesson_record_id);

drop policy if exists "lesson record blocks follow record owner" on public.lesson_record_blocks;
create policy "lesson record blocks follow record owner"
on public.lesson_record_blocks
for all
to authenticated
using (
  exists (
    select 1
    from public.lesson_records r
    where r.id = lesson_record_id
      and r.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.lesson_records r
    where r.id = lesson_record_id
      and r.user_id = (select auth.uid())
  )
  and (
    block_template_id is null
    or exists (
      select 1
      from public.block_templates b
      where b.id = block_template_id
        and b.user_id = (select auth.uid())
    )
  )
  and (
    schedule_plan_item_id is null
    or exists (
      select 1
      from public.schedule_plan_items spi
      join public.schedules s on s.id = spi.schedule_id
      join public.lesson_records item_record
        on item_record.id = lesson_record_id
       and item_record.schedule_id = spi.schedule_id
      where spi.id = schedule_plan_item_id
        and s.user_id = (select auth.uid())
    )
  )
);

-- Backfill plan headers without changing any existing schedule value.
update public.schedules s
set lesson_plan_name_snapshot = p.name,
    lesson_plan_theme_snapshot = p.theme,
    lesson_plan_format_snapshot = p.format,
    lesson_plan_memo_snapshot = p.memo,
    lesson_plan_duration_minutes_snapshot = p.duration_minutes
from public.lesson_plans p
where p.id = s.lesson_plan_id
  and s.lesson_plan_name_snapshot is null;

-- One row is inserted per lesson_plan_blocks occurrence. block_template_id is
-- deliberately not used as a de-duplication key.
insert into public.schedule_plan_items (
  schedule_id,
  lesson_plan_block_id,
  block_template_id,
  sort_order,
  planned_duration_minutes,
  block_name_snapshot,
  category_name_snapshot,
  subcategory_name_snapshot,
  purpose_snapshot,
  level_snapshot,
  script_snapshot,
  cautions_snapshot,
  memo_snapshot,
  tags_snapshot
)
select
  s.id,
  lpb.id,
  bt.id,
  lpb.sort_order,
  coalesce(lpb.planned_duration_minutes, bt.duration_minutes),
  bt.name,
  bc.name,
  bsc.name,
  bt.purpose,
  bt.level,
  coalesce(nullif(lpb.script_override, ''), bt.script),
  coalesce(nullif(lpb.cautions_override, ''), bt.cautions),
  bt.memo,
  coalesce((
    select array_agg(t.name order by t.name)
    from public.block_template_tags btt
    join public.block_tags t on t.id = btt.tag_id
    where btt.block_template_id = bt.id
  ), '{}'::text[])
from public.schedules s
join public.lesson_plan_blocks lpb on lpb.lesson_plan_id = s.lesson_plan_id
join public.block_templates bt on bt.id = lpb.block_template_id
left join public.block_categories bc on bc.id = bt.category_id
left join public.block_subcategories bsc on bsc.id = bt.subcategory_id
where not exists (
  select 1 from public.schedule_plan_items existing where existing.schedule_id = s.id
);

-- First choose exact order + template matches. This is reliable even when a
-- template occurs more than once in a plan.
with exact_matches as (
  select lrb.id as record_block_id, spi.id as schedule_plan_item_id
  from public.lesson_record_blocks lrb
  join public.lesson_records lr on lr.id = lrb.lesson_record_id
  join public.schedule_plan_items spi
    on spi.schedule_id = lr.schedule_id
   and spi.block_template_id = lrb.block_template_id
   and spi.sort_order = lrb.sort_order
  where lrb.schedule_plan_item_id is null
)
update public.lesson_record_blocks lrb
set schedule_plan_item_id = exact_matches.schedule_plan_item_id
from exact_matches
where lrb.id = exact_matches.record_block_id;

-- For remaining rows, use occurrence order only when both sides have the same
-- number of occurrences. Ambiguous historical rows intentionally remain null.
with record_occurrences as (
  select
    lrb.id,
    lr.schedule_id,
    lrb.block_template_id,
    row_number() over (
      partition by lrb.lesson_record_id, lrb.block_template_id
      order by lrb.sort_order, lrb.created_at, lrb.id
    ) as occurrence_no,
    count(*) over (
      partition by lrb.lesson_record_id, lrb.block_template_id
    ) as occurrence_count
  from public.lesson_record_blocks lrb
  join public.lesson_records lr on lr.id = lrb.lesson_record_id
  where lrb.schedule_plan_item_id is null
    and lr.schedule_id is not null
    and lrb.block_template_id is not null
),
planned_occurrences as (
  select
    spi.id,
    spi.schedule_id,
    spi.block_template_id,
    row_number() over (
      partition by spi.schedule_id, spi.block_template_id
      order by spi.sort_order, spi.created_at, spi.id
    ) as occurrence_no,
    count(*) over (
      partition by spi.schedule_id, spi.block_template_id
    ) as occurrence_count
  from public.schedule_plan_items spi
  where spi.block_template_id is not null
),
reliable_matches as (
  select ro.id as record_block_id, po.id as schedule_plan_item_id
  from record_occurrences ro
  join planned_occurrences po
    on po.schedule_id = ro.schedule_id
   and po.block_template_id = ro.block_template_id
   and po.occurrence_no = ro.occurrence_no
   and po.occurrence_count = ro.occurrence_count
)
update public.lesson_record_blocks lrb
set schedule_plan_item_id = reliable_matches.schedule_plan_item_id
from reliable_matches
where lrb.id = reliable_matches.record_block_id;

with snapshot_values as (
  select
    lrb.id,
    coalesce(spi.block_name_snapshot, bt.name, '') as display_name_snapshot,
    coalesce(spi.category_name_snapshot, bc.name) as category_name_snapshot,
    coalesce(spi.subcategory_name_snapshot, bsc.name) as subcategory_name_snapshot,
    coalesce(spi.planned_duration_minutes, bt.duration_minutes) as planned_duration_minutes,
    coalesce(spi.purpose_snapshot, bt.purpose) as purpose_snapshot,
    coalesce(spi.level_snapshot, bt.level) as level_snapshot,
    coalesce(spi.script_snapshot, bt.script) as script_snapshot,
    coalesce(spi.cautions_snapshot, bt.cautions) as cautions_snapshot
  from public.lesson_record_blocks lrb
  join public.block_templates bt on bt.id = lrb.block_template_id
  left join public.block_categories bc on bc.id = bt.category_id
  left join public.block_subcategories bsc on bsc.id = bt.subcategory_id
  left join public.schedule_plan_items spi on spi.id = lrb.schedule_plan_item_id
)
update public.lesson_record_blocks lrb
set item_source = 'planned',
    display_name_snapshot = snapshot_values.display_name_snapshot,
    category_name_snapshot = snapshot_values.category_name_snapshot,
    subcategory_name_snapshot = snapshot_values.subcategory_name_snapshot,
    planned_duration_minutes = snapshot_values.planned_duration_minutes,
    purpose_snapshot = snapshot_values.purpose_snapshot,
    level_snapshot = snapshot_values.level_snapshot,
    script_snapshot = snapshot_values.script_snapshot,
    cautions_snapshot = snapshot_values.cautions_snapshot
from snapshot_values
where lrb.id = snapshot_values.id;

create or replace function public.save_lesson_plan(
  p_plan_id uuid,
  p_name text,
  p_theme text,
  p_format text,
  p_memo text,
  p_status text,
  p_blocks jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_plan_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if nullif(btrim(p_name), '') is null then
    raise exception using errcode = '22023', message = '[YN_PLAN_NAME_REQUIRED] Lesson plan name is required.';
  end if;
  if (p_format is not null and p_format not in ('personal', 'group', 'online'))
     or p_status not in ('draft', 'ready', 'archived') then
    raise exception using errcode = '22023', message = '[YN_PLAN_INVALID] Invalid lesson plan format or status.';
  end if;
  if jsonb_typeof(coalesce(p_blocks, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_blocks, '[]'::jsonb)) = 0 then
    raise exception using errcode = '22023', message = '[YN_PLAN_BLOCKS_REQUIRED] At least one block is required.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    left join public.block_templates b
      on b.id = nullif(item->>'block_template_id', '')::uuid
     and b.user_id = v_user_id
    where b.id is null
  ) then
    raise exception using errcode = '42501', message = '[YN_PLAN_BLOCK_FORBIDDEN] A block is missing or is not owned by this user.';
  end if;

  if p_plan_id is null then
    insert into public.lesson_plans (
      user_id, name, theme, duration_minutes, format, memo, status
    )
    values (
      v_user_id,
      btrim(p_name),
      nullif(btrim(p_theme), ''),
      coalesce((
        select sum(coalesce((item->>'planned_duration_minutes')::integer, 0))
        from jsonb_array_elements(p_blocks) item
      ), 0),
      p_format,
      p_memo,
      p_status
    )
    returning id into v_plan_id;
  else
    update public.lesson_plans
    set name = btrim(p_name),
        theme = nullif(btrim(p_theme), ''),
        duration_minutes = coalesce((
          select sum(coalesce((item->>'planned_duration_minutes')::integer, 0))
          from jsonb_array_elements(p_blocks) item
        ), 0),
        format = p_format,
        memo = p_memo,
        status = p_status,
        updated_at = now()
    where id = p_plan_id
      and user_id = v_user_id
    returning id into v_plan_id;

    if v_plan_id is null then
      raise exception using errcode = 'P0002', message = '[YN_PLAN_NOT_FOUND] Lesson plan was not found.';
    end if;
  end if;

  delete from public.lesson_plan_blocks where lesson_plan_id = v_plan_id;

  insert into public.lesson_plan_blocks (
    lesson_plan_id,
    block_template_id,
    sort_order,
    planned_duration_minutes,
    script_override,
    cautions_override
  )
  select
    v_plan_id,
    (item->>'block_template_id')::uuid,
    (ordinality - 1)::integer,
    coalesce((item->>'planned_duration_minutes')::integer, 0),
    nullif(item->>'script_override', ''),
    nullif(item->>'cautions_override', '')
  from jsonb_array_elements(p_blocks) with ordinality as block_rows(item, ordinality);

  return v_plan_id;
end;
$$;

create or replace function public.save_schedule(
  p_schedule_id uuid,
  p_lesson_plan_id uuid,
  p_lesson_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_place text,
  p_format text,
  p_schedule_caution text,
  p_schedule_memo text,
  p_status text,
  p_participant_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_schedule_id uuid;
  v_old_plan_id uuid;
  v_plan_changed boolean := true;
  v_plan public.lesson_plans%rowtype;
  v_participant_ids uuid[] := coalesce(p_participant_ids, '{}'::uuid[]);
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if p_ends_at <= p_starts_at
     or p_format not in ('personal', 'group', 'online')
     or p_status not in ('scheduled', 'preparing', 'prepared', 'record_pending', 'recorded') then
    raise exception using errcode = '22023', message = '[YN_SCHEDULE_INVALID] Invalid schedule values.';
  end if;

  select p.* into v_plan
  from public.lesson_plans p
  where p.id = p_lesson_plan_id
    and p.user_id = v_user_id;
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_SCHEDULE_PLAN_NOT_FOUND] Lesson plan was not found.';
  end if;

  if exists (
    select 1
    from unnest(v_participant_ids) participant_id
    left join public.students st
      on st.id = participant_id
     and st.user_id = v_user_id
    where st.id is null
  ) then
    raise exception using errcode = '42501', message = '[YN_SCHEDULE_STUDENT_FORBIDDEN] A student is missing or is not owned by this user.';
  end if;

  if p_schedule_id is null then
    insert into public.schedules (
      user_id,
      lesson_plan_id,
      lesson_name,
      starts_at,
      ends_at,
      place,
      format,
      schedule_caution,
      schedule_memo,
      status,
      lesson_plan_name_snapshot,
      lesson_plan_theme_snapshot,
      lesson_plan_format_snapshot,
      lesson_plan_memo_snapshot,
      lesson_plan_duration_minutes_snapshot
    )
    values (
      v_user_id,
      p_lesson_plan_id,
      coalesce(nullif(btrim(p_lesson_name), ''), v_plan.name),
      p_starts_at,
      p_ends_at,
      nullif(btrim(p_place), ''),
      p_format,
      nullif(btrim(p_schedule_caution), ''),
      nullif(btrim(p_schedule_memo), ''),
      p_status,
      v_plan.name,
      v_plan.theme,
      v_plan.format,
      v_plan.memo,
      v_plan.duration_minutes
    )
    returning id into v_schedule_id;
  else
    select s.lesson_plan_id into v_old_plan_id
    from public.schedules s
    where s.id = p_schedule_id
      and s.user_id = v_user_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = '[YN_SCHEDULE_NOT_FOUND] Schedule was not found.';
    end if;

    v_schedule_id := p_schedule_id;
    v_plan_changed := v_old_plan_id is distinct from p_lesson_plan_id;
    if v_plan_changed and exists (
      select 1 from public.lesson_records lr where lr.schedule_id = v_schedule_id
    ) then
      raise exception using
        errcode = 'P0001',
        message = '[YN_SCHEDULE_PLAN_LOCKED] 実施後記録がある予定では、使用プランを変更できません。日時・場所・生徒は編集できます。';
    end if;

    update public.schedules
    set lesson_plan_id = p_lesson_plan_id,
        lesson_name = coalesce(nullif(btrim(p_lesson_name), ''), v_plan.name),
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        place = nullif(btrim(p_place), ''),
        format = p_format,
        schedule_caution = nullif(btrim(p_schedule_caution), ''),
        schedule_memo = nullif(btrim(p_schedule_memo), ''),
        status = p_status,
        lesson_plan_name_snapshot = case when v_plan_changed then v_plan.name else lesson_plan_name_snapshot end,
        lesson_plan_theme_snapshot = case when v_plan_changed then v_plan.theme else lesson_plan_theme_snapshot end,
        lesson_plan_format_snapshot = case when v_plan_changed then v_plan.format else lesson_plan_format_snapshot end,
        lesson_plan_memo_snapshot = case when v_plan_changed then v_plan.memo else lesson_plan_memo_snapshot end,
        lesson_plan_duration_minutes_snapshot = case when v_plan_changed then v_plan.duration_minutes else lesson_plan_duration_minutes_snapshot end,
        updated_at = now()
    where id = v_schedule_id
      and user_id = v_user_id;
  end if;

  delete from public.schedule_participants sp
  where sp.schedule_id = v_schedule_id
    and not (sp.student_id = any(v_participant_ids));

  insert into public.schedule_participants (schedule_id, student_id, attendance_status)
  select v_schedule_id, participant_id, 'present'
  from unnest(v_participant_ids) participant_id
  on conflict (schedule_id, student_id) do nothing;

  if p_schedule_id is null or v_plan_changed then
    delete from public.schedule_plan_items where schedule_id = v_schedule_id;

    insert into public.schedule_plan_items (
      schedule_id,
      lesson_plan_block_id,
      block_template_id,
      sort_order,
      planned_duration_minutes,
      block_name_snapshot,
      category_name_snapshot,
      subcategory_name_snapshot,
      purpose_snapshot,
      level_snapshot,
      script_snapshot,
      cautions_snapshot,
      memo_snapshot,
      tags_snapshot
    )
    select
      v_schedule_id,
      lpb.id,
      bt.id,
      lpb.sort_order,
      coalesce(lpb.planned_duration_minutes, bt.duration_minutes),
      bt.name,
      bc.name,
      bsc.name,
      bt.purpose,
      bt.level,
      coalesce(nullif(lpb.script_override, ''), bt.script),
      coalesce(nullif(lpb.cautions_override, ''), bt.cautions),
      bt.memo,
      coalesce((
        select array_agg(t.name order by t.name)
        from public.block_template_tags btt
        join public.block_tags t on t.id = btt.tag_id
        where btt.block_template_id = bt.id
      ), '{}'::text[])
    from public.lesson_plan_blocks lpb
    join public.block_templates bt on bt.id = lpb.block_template_id
    left join public.block_categories bc on bc.id = bt.category_id
    left join public.block_subcategories bsc on bsc.id = bt.subcategory_id
    where lpb.lesson_plan_id = p_lesson_plan_id
    order by lpb.sort_order;
  end if;

  return v_schedule_id;
end;
$$;

create or replace function public.save_lesson_record(
  p_record_id uuid,
  p_schedule_id uuid,
  p_status text,
  p_overall_memo text,
  p_overall_reaction text,
  p_improvement text,
  p_blocks jsonb,
  p_students jsonb,
  p_previous_followups jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_record_id uuid;
  v_schedule public.schedules%rowtype;
  v_followup jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if p_status not in ('draft', 'completed') then
    raise exception using errcode = '22023', message = '[YN_RECORD_STATUS_INVALID] Invalid lesson record status.';
  end if;
  if jsonb_typeof(coalesce(p_blocks, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_students, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_previous_followups, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = '[YN_RECORD_PAYLOAD_INVALID] Invalid lesson record payload.';
  end if;

  select s.* into v_schedule
  from public.schedules s
  where s.id = p_schedule_id
    and s.user_id = v_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_RECORD_SCHEDULE_NOT_FOUND] Schedule was not found.';
  end if;

  if p_record_id is null then
    insert into public.lesson_records (
      user_id,
      schedule_id,
      lesson_plan_id,
      lesson_name,
      record_date,
      overall_memo,
      student_reaction,
      improvement
    )
    values (
      v_user_id,
      p_schedule_id,
      v_schedule.lesson_plan_id,
      v_schedule.lesson_name,
      (v_schedule.starts_at at time zone 'Asia/Tokyo')::date,
      nullif(btrim(p_overall_memo), ''),
      nullif(btrim(p_overall_reaction), ''),
      nullif(btrim(p_improvement), '')
    )
    returning id into v_record_id;
  else
    update public.lesson_records
    set lesson_plan_id = v_schedule.lesson_plan_id,
        lesson_name = v_schedule.lesson_name,
        record_date = (v_schedule.starts_at at time zone 'Asia/Tokyo')::date,
        overall_memo = nullif(btrim(p_overall_memo), ''),
        student_reaction = nullif(btrim(p_overall_reaction), ''),
        improvement = nullif(btrim(p_improvement), ''),
        updated_at = now()
    where id = p_record_id
      and schedule_id = p_schedule_id
      and user_id = v_user_id
    returning id into v_record_id;
    if v_record_id is null then
      raise exception using errcode = 'P0002', message = '[YN_RECORD_NOT_FOUND] Lesson record was not found.';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'schedule_plan_item_id', '') is not null
      and not exists (
        select 1
        from public.schedule_plan_items spi
        where spi.id = (item->>'schedule_plan_item_id')::uuid
          and spi.schedule_id = p_schedule_id
      )
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_PLAN_ITEM_FORBIDDEN] A planned item is missing or belongs to another schedule.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'block_template_id', '') is not null
      and not exists (
        select 1
        from public.block_templates bt
        where bt.id = (item->>'block_template_id')::uuid
          and bt.user_id = v_user_id
      )
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_BLOCK_FORBIDDEN] A block is missing or is not owned by this user.';
  end if;

  delete from public.lesson_record_blocks where lesson_record_id = v_record_id;

  insert into public.lesson_record_blocks (
    lesson_record_id,
    schedule_plan_item_id,
    block_template_id,
    sort_order,
    item_source,
    display_name_snapshot,
    category_name_snapshot,
    subcategory_name_snapshot,
    planned_duration_minutes,
    purpose_snapshot,
    level_snapshot,
    script_snapshot,
    cautions_snapshot,
    done,
    actual_duration_minutes,
    reaction,
    teacher_memo,
    improvement_memo,
    use_again,
    script_revision
  )
  select
    v_record_id,
    spi.id,
    coalesce(spi.block_template_id, bt.id),
    coalesce((item->>'sort_order')::integer, (ordinality - 1)::integer),
    coalesce(nullif(item->>'item_source', ''), 'planned'),
    coalesce(spi.block_name_snapshot, bt.name, nullif(item->>'display_name_snapshot', ''), ''),
    coalesce(spi.category_name_snapshot, bc.name, nullif(item->>'category_name_snapshot', '')),
    coalesce(spi.subcategory_name_snapshot, bsc.name, nullif(item->>'subcategory_name_snapshot', '')),
    coalesce(spi.planned_duration_minutes, (item->>'planned_duration_minutes')::integer, bt.duration_minutes),
    coalesce(spi.purpose_snapshot, bt.purpose, nullif(item->>'purpose_snapshot', '')),
    coalesce(spi.level_snapshot, bt.level, nullif(item->>'level_snapshot', '')),
    coalesce(spi.script_snapshot, bt.script, nullif(item->>'script_snapshot', '')),
    coalesce(spi.cautions_snapshot, bt.cautions, nullif(item->>'cautions_snapshot', '')),
    (item->>'done')::boolean,
    nullif(item->>'actual_duration_minutes', '')::integer,
    nullif(item->>'reaction', ''),
    nullif(item->>'teacher_memo', ''),
    nullif(item->>'improvement_memo', ''),
    (item->>'use_again')::boolean,
    nullif(item->>'script_revision', '')
  from jsonb_array_elements(p_blocks) with ordinality as block_rows(item, ordinality)
  left join public.schedule_plan_items spi
    on spi.id = nullif(item->>'schedule_plan_item_id', '')::uuid
   and spi.schedule_id = p_schedule_id
  left join public.block_templates bt
    on bt.id = coalesce(spi.block_template_id, nullif(item->>'block_template_id', '')::uuid)
   and bt.user_id = v_user_id
  left join public.block_categories bc on bc.id = bt.category_id
  left join public.block_subcategories bsc on bsc.id = bt.subcategory_id;

  if exists (
    select 1
    from jsonb_array_elements(p_students) item
    left join public.students st
      on st.id = (item->>'student_id')::uuid
     and st.user_id = v_user_id
    where st.id is null
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_STUDENT_FORBIDDEN] A student is missing or is not owned by this user.';
  end if;

  insert into public.lesson_record_students as current_row (
    lesson_record_id,
    student_id,
    attendance_status,
    condition,
    memo,
    next_follow,
    follow_up_status,
    follow_up_completed_at,
    follow_up_completed_note,
    follow_up_updated_at
  )
  select
    v_record_id,
    (item->>'student_id')::uuid,
    coalesce(nullif(item->>'attendance_status', ''), 'present'),
    nullif(btrim(item->>'condition'), ''),
    nullif(btrim(item->>'memo'), ''),
    nullif(btrim(item->>'next_follow'), ''),
    case when nullif(btrim(item->>'next_follow'), '') is null then 'none' else 'pending' end,
    null,
    null,
    now()
  from jsonb_array_elements(p_students) item
  on conflict (lesson_record_id, student_id) do update
  set attendance_status = excluded.attendance_status,
      condition = excluded.condition,
      memo = excluded.memo,
      next_follow = excluded.next_follow,
      follow_up_status = case
        when excluded.next_follow is null then 'none'
        when nullif(btrim(current_row.next_follow), '') is not distinct from excluded.next_follow then current_row.follow_up_status
        else 'pending'
      end,
      follow_up_completed_at = case
        when nullif(btrim(current_row.next_follow), '') is not distinct from excluded.next_follow
          and excluded.next_follow is not null
        then current_row.follow_up_completed_at
        else null
      end,
      follow_up_completed_note = case
        when nullif(btrim(current_row.next_follow), '') is not distinct from excluded.next_follow
          and excluded.next_follow is not null
        then current_row.follow_up_completed_note
        else null
      end,
      follow_up_updated_at = case
        when nullif(btrim(current_row.next_follow), '') is not distinct from excluded.next_follow
        then current_row.follow_up_updated_at
        else now()
      end,
      updated_at = now();

  delete from public.lesson_record_students lrs
  where lrs.lesson_record_id = v_record_id
    and not exists (
      select 1
      from jsonb_array_elements(p_students) item
      where (item->>'student_id')::uuid = lrs.student_id
    );

  for v_followup in select value from jsonb_array_elements(p_previous_followups)
  loop
    if v_followup->>'status' in ('completed', 'dismissed') then
      update public.lesson_record_students lrs
      set follow_up_status = v_followup->>'status',
          follow_up_completed_at = now(),
          follow_up_completed_note = nullif(btrim(v_followup->>'note'), ''),
          follow_up_updated_at = now(),
          updated_at = now()
      where lrs.id = (v_followup->>'id')::uuid
        and exists (
          select 1
          from public.lesson_records owner_record
          where owner_record.id = lrs.lesson_record_id
            and owner_record.user_id = v_user_id
        );
    end if;
  end loop;

  update public.schedules
  set status = case when p_status = 'completed' then 'recorded' else 'record_pending' end,
      updated_at = now()
  where id = p_schedule_id
    and user_id = v_user_id;

  return v_record_id;
end;
$$;

revoke execute on function public.save_lesson_plan(uuid, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.save_lesson_plan(uuid, text, text, text, text, text, jsonb) to authenticated, service_role;

revoke execute on function public.save_schedule(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.save_schedule(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) to authenticated, service_role;

revoke execute on function public.save_lesson_record(uuid, uuid, text, text, text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_lesson_record(uuid, uuid, text, text, text, text, jsonb, jsonb, jsonb) to authenticated, service_role;
