-- YN-006..010: adaptive lesson execution workflow.
-- Existing rows are intentionally left unchanged; change_type remains null for legacy data.

alter table public.lesson_record_blocks
  add column if not exists change_type text,
  add column if not exists change_reason_codes text[] not null default '{}',
  add column if not exists change_reason_note text,
  add column if not exists actual_content_note text,
  add column if not exists replaces_schedule_plan_item_id uuid references public.schedule_plan_items(id) on delete set null,
  add column if not exists memo_snapshot text,
  add column if not exists tags_snapshot text[] not null default '{}';

alter table public.lesson_record_blocks
  drop constraint if exists lesson_record_blocks_change_type_check,
  drop constraint if exists lesson_record_blocks_change_reason_codes_check;

alter table public.lesson_record_blocks
  add constraint lesson_record_blocks_change_type_check
    check (change_type is null or change_type in ('as_planned', 'adjusted', 'skipped', 'replaced', 'added')),
  add constraint lesson_record_blocks_change_reason_codes_check
    check (
      change_reason_codes <@ array[
        'student_reaction',
        'pain_safety',
        'beginner_level',
        'advanced_level',
        'fatigue_focus',
        'time_shortage',
        'extra_time',
        'student_request',
        'space_equipment',
        'other'
      ]::text[]
    );

create index if not exists lesson_record_blocks_replaces_plan_item_idx
  on public.lesson_record_blocks(replaces_schedule_plan_item_id)
  where replaces_schedule_plan_item_id is not null;

create index if not exists lesson_record_blocks_template_idx
  on public.lesson_record_blocks(block_template_id)
  where block_template_id is not null;

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
      user_id, schedule_id, lesson_plan_id, lesson_name, record_date,
      overall_memo, student_reaction, improvement
    )
    values (
      v_user_id, p_schedule_id, v_schedule.lesson_plan_id, v_schedule.lesson_name,
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
    where coalesce(item->>'item_source', 'planned') not in ('planned', 'library', 'improvised')
       or (nullif(item->>'change_type', '') is not null
           and item->>'change_type' not in ('as_planned', 'adjusted', 'skipped', 'replaced', 'added'))
       or jsonb_typeof(coalesce(item->'change_reason_codes', '[]'::jsonb)) <> 'array'
       or jsonb_typeof(coalesce(item->'tags_snapshot', '[]'::jsonb)) <> 'array'
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_ITEM_INVALID] Invalid lesson record item.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    cross join lateral jsonb_array_elements_text(coalesce(item->'change_reason_codes', '[]'::jsonb)) reason(code)
    where reason.code not in (
      'student_reaction', 'pain_safety', 'beginner_level', 'advanced_level',
      'fatigue_focus', 'time_shortage', 'extra_time', 'student_request',
      'space_equipment', 'other'
    )
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_CHANGE_REASON_INVALID] Invalid change reason.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) with ordinality rows(item, ordinality)
    group by coalesce(nullif(rows.item->>'sort_order', '')::integer, (rows.ordinality - 1)::integer)
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_SORT_ORDER_DUPLICATE] Execution order is duplicated.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'record_block_id', '') is not null
      and not exists (
        select 1 from public.lesson_record_blocks lrb
        where lrb.id = (item->>'record_block_id')::uuid
          and lrb.lesson_record_id = v_record_id
      )
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_ITEM_FORBIDDEN] A record item does not belong to this record.';
  end if;

  if exists (
    select nullif(item->>'schedule_plan_item_id', '')
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'schedule_plan_item_id', '') is not null
    group by nullif(item->>'schedule_plan_item_id', '')
    having count(*) > 1
  ) then
    raise exception using errcode = '23505', message = '[YN_RECORD_PLAN_ITEM_DUPLICATE] A planned item is duplicated.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where coalesce(item->>'item_source', 'planned') = 'planned'
      and nullif(item->>'schedule_plan_item_id', '') is null
      and not exists (
        select 1
        from public.lesson_record_blocks legacy
        where legacy.id = nullif(item->>'record_block_id', '')::uuid
          and legacy.lesson_record_id = v_record_id
          and legacy.item_source = 'planned'
          and legacy.schedule_plan_item_id is null
      )
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_PLAN_ITEM_REQUIRED] Planned items require a schedule plan item.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'schedule_plan_item_id', '') is not null
      and (
        coalesce(item->>'item_source', 'planned') <> 'planned'
        or not exists (
          select 1 from public.schedule_plan_items spi
          where spi.id = (item->>'schedule_plan_item_id')::uuid
            and spi.schedule_id = p_schedule_id
        )
      )
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_PLAN_ITEM_FORBIDDEN] A planned item is missing or belongs to another schedule.';
  end if;

  if exists (
    select 1
    from public.schedule_plan_items spi
    where spi.schedule_id = p_schedule_id
      and not exists (
        select 1
        from jsonb_array_elements(p_blocks) item
        where coalesce(item->>'item_source', 'planned') = 'planned'
          and nullif(item->>'schedule_plan_item_id', '')::uuid = spi.id
      )
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_PLAN_ITEM_MISSING] Planned items cannot be deleted.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'block_template_id', '') is not null
      and not exists (
        select 1 from public.block_templates bt
        where bt.id = (item->>'block_template_id')::uuid
          and bt.user_id = v_user_id
      )
  ) then
    raise exception using errcode = '42501', message = '[YN_RECORD_BLOCK_FORBIDDEN] A block is missing or is not owned by this user.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where coalesce(item->>'item_source', 'planned') = 'library'
      and (
        nullif(item->>'block_template_id', '') is null
        or (
          not exists (
            select 1 from public.block_templates bt
            where bt.id = (item->>'block_template_id')::uuid
              and bt.user_id = v_user_id
              and bt.archived = false
          )
          and not exists (
            select 1 from public.lesson_record_blocks existing
            where existing.id = nullif(item->>'record_block_id', '')::uuid
              and existing.lesson_record_id = v_record_id
              and existing.block_template_id = (item->>'block_template_id')::uuid
          )
        )
      )
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_LIBRARY_BLOCK_INVALID] Library items require an active owned block.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where coalesce(item->>'item_source', 'planned') = 'improvised'
      and nullif(btrim(item->>'display_name_snapshot'), '') is null
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_IMPROVISED_NAME_REQUIRED] Improvised items require a name.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where coalesce(item->>'item_source', 'planned') in ('library', 'improvised')
      and nullif(item->>'schedule_plan_item_id', '') is not null
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_ADDED_PLAN_ITEM_INVALID] Added items cannot reference a planned item directly.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where (item->>'change_type' in ('as_planned', 'adjusted') and (item->>'done')::boolean is distinct from true)
       or (item->>'change_type' in ('skipped', 'replaced') and (item->>'done')::boolean is distinct from false)
       or (item->>'change_type' = 'added' and (item->>'done')::boolean is distinct from true)
       or (coalesce(item->>'item_source', 'planned') = 'planned' and item->>'change_type' = 'added')
       or (coalesce(item->>'item_source', 'planned') <> 'planned'
           and item->>'change_type' is not null
           and item->>'change_type' <> 'added')
       or (coalesce(item->>'item_source', 'planned') <> 'planned'
           and nullif(item->>'record_block_id', '') is null
           and item->>'change_type' is distinct from 'added')
       or (nullif(item->>'actual_duration_minutes', '')::integer < 0)
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_CHANGE_STATE_INVALID] Change type and execution state do not match.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where nullif(item->>'replaces_schedule_plan_item_id', '') is not null
      and (
        coalesce(item->>'item_source', 'planned') not in ('library', 'improvised')
        or item->>'change_type' <> 'added'
        or (item->>'done')::boolean is distinct from true
        or not exists (
          select 1 from public.schedule_plan_items spi
          where spi.id = (item->>'replaces_schedule_plan_item_id')::uuid
            and spi.schedule_id = p_schedule_id
        )
        or not exists (
          select 1 from jsonb_array_elements(p_blocks) source_item
          where source_item->>'item_source' = 'planned'
            and nullif(source_item->>'schedule_plan_item_id', '')::uuid = (item->>'replaces_schedule_plan_item_id')::uuid
            and source_item->>'change_type' = 'replaced'
            and (source_item->>'done')::boolean is not distinct from false
        )
      )
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_REPLACEMENT_INVALID] Replacement relationship is invalid.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_blocks) source_item
    where source_item->>'item_source' = 'planned'
      and source_item->>'change_type' = 'replaced'
      and (
        select count(*)
        from jsonb_array_elements(p_blocks) replacement_item
        where nullif(replacement_item->>'replaces_schedule_plan_item_id', '')::uuid =
              nullif(source_item->>'schedule_plan_item_id', '')::uuid
      ) <> 1
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_REPLACEMENT_MISSING] Replaced items require one actual item.';
  end if;

  if p_status = 'completed' and exists (
    select 1
    from jsonb_array_elements(p_blocks) item
    where (coalesce(item->>'item_source', 'planned') = 'planned' and item->>'done' is null)
       or (coalesce(item->>'item_source', 'planned') in ('library', 'improvised')
           and (item->>'done')::boolean is distinct from true)
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_UNCONFIRMED_ITEMS] Complete all planned execution states before finishing.';
  end if;

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

  if exists (
    select 1
    from jsonb_array_elements(p_students) item
    where coalesce(nullif(item->>'attendance_status', ''), 'present') not in ('present', 'cancelled', 'no_show')
  ) then
    raise exception using errcode = '22023', message = '[YN_RECORD_ATTENDANCE_INVALID] Invalid attendance status.';
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
    memo_snapshot,
    tags_snapshot,
    change_type,
    change_reason_codes,
    change_reason_note,
    actual_content_note,
    replaces_schedule_plan_item_id,
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
    case
      when coalesce(item->>'item_source', 'planned') = 'planned' then coalesce(spi.block_template_id, nullif(item->>'block_template_id', '')::uuid)
      else nullif(item->>'block_template_id', '')::uuid
    end,
    coalesce(nullif(item->>'sort_order', '')::integer, (ordinality - 1)::integer),
    coalesce(nullif(item->>'item_source', ''), 'planned'),
    case when spi.id is not null then spi.block_name_snapshot else coalesce(nullif(item->>'display_name_snapshot', ''), bt.name, '') end,
    case when spi.id is not null then spi.category_name_snapshot else coalesce(nullif(item->>'category_name_snapshot', ''), bc.name) end,
    case when spi.id is not null then spi.subcategory_name_snapshot else coalesce(nullif(item->>'subcategory_name_snapshot', ''), bsc.name) end,
    case when spi.id is not null then spi.planned_duration_minutes else coalesce(nullif(item->>'planned_duration_minutes', '')::integer, bt.duration_minutes) end,
    case when spi.id is not null then spi.purpose_snapshot else coalesce(nullif(item->>'purpose_snapshot', ''), bt.purpose) end,
    case when spi.id is not null then spi.level_snapshot else coalesce(nullif(item->>'level_snapshot', ''), bt.level) end,
    case when spi.id is not null then spi.script_snapshot else coalesce(item->>'script_snapshot', bt.script) end,
    case when spi.id is not null then spi.cautions_snapshot else coalesce(item->>'cautions_snapshot', bt.cautions) end,
    case when spi.id is not null then spi.memo_snapshot else coalesce(item->>'memo_snapshot', bt.memo) end,
    case
      when spi.id is not null then spi.tags_snapshot
      else coalesce(array(select jsonb_array_elements_text(coalesce(item->'tags_snapshot', '[]'::jsonb))), '{}'::text[])
    end,
    case
      when spi.id is not null
        and (
          select count(*)
          from jsonb_array_elements(p_blocks) with ordinality as other_rows(other_item, other_ordinality)
          where coalesce(other_item->>'item_source', 'planned') = 'planned'
            and coalesce(nullif(other_item->>'sort_order', '')::integer, (other_ordinality - 1)::integer)
                < coalesce(nullif(item->>'sort_order', '')::integer, (ordinality - 1)::integer)
        ) <> (
          select count(*)
          from public.schedule_plan_items earlier_spi
          where earlier_spi.schedule_id = p_schedule_id
            and earlier_spi.sort_order < spi.sort_order
        )
        and nullif(item->>'change_type', '') is not null
        and item->>'change_type' not in ('skipped', 'replaced')
      then 'adjusted'
      when spi.id is not null
        and (
          select count(*)
          from jsonb_array_elements(p_blocks) with ordinality as other_rows(other_item, other_ordinality)
          where coalesce(other_item->>'item_source', 'planned') = 'planned'
            and coalesce(nullif(other_item->>'sort_order', '')::integer, (other_ordinality - 1)::integer)
                < coalesce(nullif(item->>'sort_order', '')::integer, (ordinality - 1)::integer)
        ) <> (
          select count(*)
          from public.schedule_plan_items earlier_spi
          where earlier_spi.schedule_id = p_schedule_id
            and earlier_spi.sort_order < spi.sort_order
        )
        and nullif(item->>'change_type', '') is null
        and (item->>'done')::boolean is true
      then 'adjusted'
      else nullif(item->>'change_type', '')
    end,
    coalesce(array(select jsonb_array_elements_text(coalesce(item->'change_reason_codes', '[]'::jsonb))), '{}'::text[]),
    nullif(btrim(item->>'change_reason_note'), ''),
    nullif(btrim(item->>'actual_content_note'), ''),
    nullif(item->>'replaces_schedule_plan_item_id', '')::uuid,
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
      select 1 from jsonb_array_elements(p_students) item
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
          select 1 from public.lesson_records owner_record
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

create or replace function public.create_block_template_from_record_item(
  p_record_block_id uuid,
  p_name text,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_duration_minutes integer,
  p_purpose text,
  p_level text,
  p_script text,
  p_cautions text,
  p_memo text,
  p_tags text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_template_id uuid;
  v_tag text;
  v_tag_name text;
  v_tag_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if nullif(btrim(p_name), '') is null then
    raise exception using errcode = '22023', message = '[YN_TEMPLATE_NAME_REQUIRED] Block name is required.';
  end if;
  if p_duration_minutes is null or p_duration_minutes < 1 then
    raise exception using errcode = '22023', message = '[YN_TEMPLATE_DURATION_INVALID] Duration must be at least one minute.';
  end if;
  if p_category_id is not null and not exists (
    select 1 from public.block_categories bc
    where bc.id = p_category_id and bc.user_id = v_user_id and bc.archived = false
  ) then
    raise exception using errcode = '42501', message = '[YN_TEMPLATE_CATEGORY_FORBIDDEN] Category is unavailable.';
  end if;
  if p_subcategory_id is not null and not exists (
    select 1 from public.block_subcategories bsc
    where bsc.id = p_subcategory_id
      and bsc.user_id = v_user_id
      and bsc.archived = false
      and (p_category_id is null or bsc.category_id = p_category_id)
  ) then
    raise exception using errcode = '42501', message = '[YN_TEMPLATE_SUBCATEGORY_FORBIDDEN] Subcategory is unavailable.';
  end if;

  perform 1
  from public.lesson_record_blocks lrb
  join public.lesson_records lr on lr.id = lrb.lesson_record_id
  where lrb.id = p_record_block_id
    and lr.user_id = v_user_id
    and lrb.item_source = 'improvised'
    and lrb.block_template_id is null
  for update of lrb;
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_TEMPLATE_RECORD_ITEM_UNAVAILABLE] Improvised item is unavailable or already saved.';
  end if;

  insert into public.block_templates (
    user_id, category_id, subcategory_id, name, duration_minutes,
    purpose, level, script, cautions, memo, favorite, archived
  )
  values (
    v_user_id, p_category_id, p_subcategory_id, btrim(p_name), p_duration_minutes,
    nullif(btrim(p_purpose), ''), nullif(btrim(p_level), ''), nullif(p_script, ''),
    nullif(p_cautions, ''), nullif(p_memo, ''), false, false
  )
  returning id into v_template_id;

  foreach v_tag in array coalesce(p_tags, '{}'::text[])
  loop
    v_tag_name := btrim(v_tag);
    if v_tag_name <> '' then
      if left(v_tag_name, 1) <> '#' then
        v_tag_name := '#' || v_tag_name;
      end if;
      insert into public.block_tags (user_id, name)
      values (v_user_id, v_tag_name)
      on conflict (user_id, name) do update set name = excluded.name
      returning id into v_tag_id;

      insert into public.block_template_tags (block_template_id, tag_id)
      values (v_template_id, v_tag_id)
      on conflict do nothing;
    end if;
  end loop;

  update public.lesson_record_blocks
  set block_template_id = v_template_id,
      updated_at = now()
  where id = p_record_block_id;

  return v_template_id;
end;
$$;

revoke execute on function public.save_lesson_record(uuid, uuid, text, text, text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_lesson_record(uuid, uuid, text, text, text, text, jsonb, jsonb, jsonb) to authenticated, service_role;

revoke execute on function public.create_block_template_from_record_item(uuid, text, uuid, uuid, integer, text, text, text, text, text, text[]) from public, anon;
grant execute on function public.create_block_template_from_record_item(uuid, text, uuid, uuid, integer, text, text, text, text, text, text[]) to authenticated, service_role;
