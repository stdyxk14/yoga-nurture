create index if not exists schedules_user_plan_ends_unrecorded_idx
  on public.schedules(user_id, lesson_plan_id, ends_at)
  where lesson_plan_id is not null and status <> 'recorded';

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
  v_plan public.lesson_plans%rowtype;
  v_old_plan_name text;
  v_schedule_ids uuid[] := '{}'::uuid[];
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
    returning * into v_plan;
  else
    select p.name into v_old_plan_name
    from public.lesson_plans p
    where p.id = p_plan_id
      and p.user_id = v_user_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = '[YN_PLAN_NOT_FOUND] Lesson plan was not found.';
    end if;

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
    returning * into v_plan;
  end if;

  v_plan_id := v_plan.id;

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

  if p_plan_id is not null then
    select coalesce(array_agg(eligible.id order by eligible.id), '{}'::uuid[])
    into v_schedule_ids
    from (
      select s.id
      from public.schedules s
      where s.user_id = v_user_id
        and s.lesson_plan_id = v_plan_id
        and s.ends_at >= now()
        and s.status <> 'recorded'
        and not exists (
          select 1
          from public.lesson_records lr
          where lr.schedule_id = s.id
            and lr.user_id = v_user_id
        )
        and not exists (
          select 1
          from public.schedule_closures sc
          where sc.schedule_id = s.id
            and sc.user_id = v_user_id
            and sc.revoked_at is null
        )
      order by s.id
      for update of s
    ) eligible;

    if cardinality(v_schedule_ids) > 0 then
      update public.schedules s
      set lesson_name = case
            when s.lesson_name = v_old_plan_name
              or s.lesson_name = s.lesson_plan_name_snapshot
            then v_plan.name
            else s.lesson_name
          end,
          lesson_plan_name_snapshot = v_plan.name,
          lesson_plan_theme_snapshot = v_plan.theme,
          lesson_plan_format_snapshot = v_plan.format,
          lesson_plan_memo_snapshot = v_plan.memo,
          lesson_plan_duration_minutes_snapshot = v_plan.duration_minutes,
          updated_at = now()
      where s.id = any(v_schedule_ids)
        and s.user_id = v_user_id
        and s.lesson_plan_id = v_plan_id;

      delete from public.schedule_plan_items spi
      where spi.schedule_id = any(v_schedule_ids);

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
        target.schedule_id,
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
      from unnest(v_schedule_ids) as target(schedule_id)
      join public.lesson_plan_blocks lpb on lpb.lesson_plan_id = v_plan_id
      join public.block_templates bt on bt.id = lpb.block_template_id
      left join public.block_categories bc on bc.id = bt.category_id
      left join public.block_subcategories bsc on bsc.id = bt.subcategory_id
      order by target.schedule_id, lpb.sort_order;
    end if;
  end if;

  return v_plan_id;
end;
$$;

revoke execute on function public.save_lesson_plan(uuid, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.save_lesson_plan(uuid, text, text, text, text, text, jsonb) to authenticated, service_role;

do $$
declare
  v_schedule_ids uuid[] := '{}'::uuid[];
begin
  select coalesce(array_agg(eligible.id order by eligible.id), '{}'::uuid[])
  into v_schedule_ids
  from (
    select s.id
    from public.schedules s
    where s.lesson_plan_id is not null
      and s.ends_at >= now()
      and s.status <> 'recorded'
      and exists (
        select 1
        from public.lesson_plans p
        where p.id = s.lesson_plan_id
          and p.user_id = s.user_id
      )
      and not exists (
        select 1 from public.lesson_records lr where lr.schedule_id = s.id
      )
      and not exists (
        select 1
        from public.schedule_closures sc
        where sc.schedule_id = s.id
          and sc.revoked_at is null
      )
    order by s.id
    for update of s
  ) eligible;

  if cardinality(v_schedule_ids) > 0 then
    update public.schedules s
    set lesson_name = case
          when s.lesson_name = s.lesson_plan_name_snapshot then p.name
          else s.lesson_name
        end,
        lesson_plan_name_snapshot = p.name,
        lesson_plan_theme_snapshot = p.theme,
        lesson_plan_format_snapshot = p.format,
        lesson_plan_memo_snapshot = p.memo,
        lesson_plan_duration_minutes_snapshot = p.duration_minutes,
        updated_at = now()
    from public.lesson_plans p
    where s.id = any(v_schedule_ids)
      and p.id = s.lesson_plan_id
      and p.user_id = s.user_id;

    delete from public.schedule_plan_items spi
    where spi.schedule_id = any(v_schedule_ids);

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
      target.schedule_id,
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
    from unnest(v_schedule_ids) as target(schedule_id)
    join public.schedules s on s.id = target.schedule_id
    join public.lesson_plan_blocks lpb on lpb.lesson_plan_id = s.lesson_plan_id
    join public.block_templates bt on bt.id = lpb.block_template_id
    left join public.block_categories bc on bc.id = bt.category_id
    left join public.block_subcategories bsc on bsc.id = bt.subcategory_id
    order by target.schedule_id, lpb.sort_order;
  end if;

  raise notice 'YN_FUTURE_SCHEDULE_BACKFILL_COUNT=%', cardinality(v_schedule_ids);
end;
$$;
