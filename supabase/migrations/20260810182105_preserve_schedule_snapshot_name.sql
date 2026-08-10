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
        lesson_name = case
          when v_plan_changed then coalesce(nullif(btrim(p_lesson_name), ''), v_plan.name)
          else lesson_name
        end,
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

revoke execute on function public.save_schedule(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.save_schedule(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) to authenticated, service_role;
