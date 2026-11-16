-- NULL keeps the existing automatic name. No backfill: existing schedules and records stay as saved.
alter table public.schedules add column custom_lesson_name text;

-- Keep lesson_name as the effective title for all existing readers, including record snapshots.
create function public.keep_custom_schedule_name()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  new.lesson_name := new.custom_lesson_name;
  return new;
end;
$$;
revoke all on function public.keep_custom_schedule_name() from public, anon, authenticated, service_role;

create trigger keep_custom_schedule_name
before insert or update of lesson_name, custom_lesson_name on public.schedules
for each row when (new.custom_lesson_name is not null)
execute function public.keep_custom_schedule_name();

-- One RPC/transaction: reuse the participant, snapshot and record locks of save_schedule.
-- Retain the original RPC unchanged for clients still running the previous app.
create function public.save_schedule_with_custom_name(
  p_schedule_id uuid, p_lesson_plan_id uuid, p_custom_lesson_name text,
  p_starts_at timestamptz, p_ends_at timestamptz, p_place text, p_format text,
  p_schedule_caution text, p_schedule_memo text, p_status text, p_participant_ids uuid[]
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := nullif(btrim(p_custom_lesson_name), '');
begin
  v_id := public.save_schedule(p_schedule_id, p_lesson_plan_id, null, p_starts_at, p_ends_at,
    p_place, p_format, p_schedule_caution, p_schedule_memo, p_status, p_participant_ids);

  update public.schedules s
  set custom_lesson_name = v_name,
      lesson_name = coalesce(v_name, case when s.lesson_plan_id is not null then
        coalesce(s.lesson_plan_name_snapshot, (select p.name from public.lesson_plans p where p.id = s.lesson_plan_id and p.user_id = s.user_id))
      end, 'レッスン内容未確定')
  where s.id = v_id and s.user_id = (select auth.uid());
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_SCHEDULE_NOT_FOUND] Schedule was not found.';
  end if;
  return v_id;
end;
$$;

revoke all on function public.save_schedule_with_custom_name(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.save_schedule_with_custom_name(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, uuid[]) to authenticated, service_role;
