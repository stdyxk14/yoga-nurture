-- Lesson-level closure history. A closure is separate from participant attendance
-- and from the existing schedule preparation/record state.

create table public.schedule_closures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  reason_code text not null check (reason_code in (
    'all_participants_cancelled',
    'minimum_participants_not_met',
    'instructor_unavailable',
    'weather_disaster_transport',
    'venue_unavailable',
    'operational',
    'other'
  )),
  decided_at timestamptz not null,
  note text,
  handoff_note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  constraint schedule_closures_revocation_check check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create unique index schedule_closures_one_active_uidx
  on public.schedule_closures(schedule_id)
  where revoked_at is null;

create index schedule_closures_user_decided_idx
  on public.schedule_closures(user_id, decided_at desc);

create index schedule_closures_schedule_history_idx
  on public.schedule_closures(schedule_id, created_at desc);

-- The application has always treated a schedule as having at most one record.
-- Preserve that invariant under concurrent record/closure operations without
-- changing any existing row.
create unique index lesson_records_schedule_uidx
  on public.lesson_records(schedule_id)
  where schedule_id is not null;

alter table public.schedule_closures enable row level security;

create policy "schedule closures are readable by owner"
on public.schedule_closures
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "schedule closures are insertable by owner"
on public.schedule_closures
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.schedules s
    where s.id = schedule_id
      and s.user_id = (select auth.uid())
  )
);

create policy "schedule closures are updatable by owner"
on public.schedule_closures
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.schedules s
    where s.id = schedule_id
      and s.user_id = (select auth.uid())
  )
);

revoke all on table public.schedule_closures from public, anon;
grant select, insert, update on table public.schedule_closures to authenticated, service_role;

create function public.set_schedule_closure_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger schedule_closures_set_updated_at
before update on public.schedule_closures
for each row execute function public.set_schedule_closure_updated_at();

create function public.enforce_schedule_closure_exclusion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  if new.revoked_at is not null then
    return new;
  end if;

  select s.status into v_status
  from public.schedules s
  where s.id = new.schedule_id;

  if v_status = 'recorded' then
    raise exception using
      errcode = '23514',
      message = '[YN_CLOSURE_COMPLETED_RECORD] A completed lesson record cannot be closed.';
  end if;

  return new;
end;
$$;

create trigger schedule_closures_exclude_completed_record
before insert or update on public.schedule_closures
for each row execute function public.enforce_schedule_closure_exclusion();

create function public.enforce_lesson_record_not_closed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.schedule_id is not null and exists (
    select 1
    from public.schedule_closures sc
    where sc.schedule_id = new.schedule_id
      and sc.revoked_at is null
  ) then
    raise exception using
      errcode = '23514',
      message = '[YN_RECORD_SCHEDULE_CLOSED] Reopen the schedule before creating or updating a lesson record.';
  end if;
  return new;
end;
$$;

create trigger lesson_records_exclude_active_closure
before insert or update on public.lesson_records
for each row execute function public.enforce_lesson_record_not_closed();

create function public.enforce_recorded_schedule_not_closed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'recorded' and exists (
    select 1
    from public.schedule_closures sc
    where sc.schedule_id = new.id
      and sc.revoked_at is null
  ) then
    raise exception using
      errcode = '23514',
      message = '[YN_RECORD_SCHEDULE_CLOSED] Reopen the schedule before completing a lesson record.';
  end if;
  return new;
end;
$$;

create trigger schedules_exclude_recorded_with_active_closure
before update of status on public.schedules
for each row execute function public.enforce_recorded_schedule_not_closed();

create function public.save_schedule_closure(
  p_schedule_id uuid,
  p_reason_code text,
  p_decided_at timestamptz,
  p_note text,
  p_handoff_note text,
  p_confirm_draft boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_schedule public.schedules%rowtype;
  v_closure_id uuid;
  v_has_draft boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;

  if p_reason_code not in (
    'all_participants_cancelled',
    'minimum_participants_not_met',
    'instructor_unavailable',
    'weather_disaster_transport',
    'venue_unavailable',
    'operational',
    'other'
  ) or p_decided_at is null then
    raise exception using errcode = '22023', message = '[YN_CLOSURE_INVALID] Closure reason and decision time are required.';
  end if;

  select s.* into v_schedule
  from public.schedules s
  where s.id = p_schedule_id
    and s.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = '[YN_SCHEDULE_NOT_FOUND] Schedule was not found.';
  end if;

  if v_schedule.status = 'recorded' then
    raise exception using errcode = '23514', message = '[YN_CLOSURE_COMPLETED_RECORD] A completed lesson record cannot be closed.';
  end if;

  select sc.id into v_closure_id
  from public.schedule_closures sc
  where sc.schedule_id = p_schedule_id
    and sc.revoked_at is null
  for update;

  v_has_draft := exists (
    select 1
    from public.lesson_records lr
    where lr.schedule_id = p_schedule_id
  );

  if v_closure_id is null and v_has_draft and not coalesce(p_confirm_draft, false) then
    raise exception using errcode = '23514', message = '[YN_CLOSURE_DRAFT_CONFIRM_REQUIRED] A draft lesson record exists and will be preserved.';
  end if;

  if v_closure_id is null then
    insert into public.schedule_closures (
      user_id, schedule_id, reason_code, decided_at, note, handoff_note, created_by
    ) values (
      v_user_id,
      p_schedule_id,
      p_reason_code,
      p_decided_at,
      nullif(btrim(p_note), ''),
      nullif(btrim(p_handoff_note), ''),
      v_user_id
    )
    returning id into v_closure_id;
  else
    update public.schedule_closures
    set reason_code = p_reason_code,
        decided_at = p_decided_at,
        note = nullif(btrim(p_note), ''),
        handoff_note = nullif(btrim(p_handoff_note), '')
    where id = v_closure_id;
  end if;

  return v_closure_id;
end;
$$;

create function public.reopen_schedule_closure(p_schedule_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_closure_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;

  perform 1
  from public.schedules s
  where s.id = p_schedule_id
    and s.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = '[YN_SCHEDULE_NOT_FOUND] Schedule was not found.';
  end if;

  select sc.id into v_closure_id
  from public.schedule_closures sc
  where sc.schedule_id = p_schedule_id
    and sc.user_id = v_user_id
    and sc.revoked_at is null
  for update;

  if v_closure_id is null then
    raise exception using errcode = 'P0002', message = '[YN_CLOSURE_NOT_FOUND] Active closure was not found.';
  end if;

  update public.schedule_closures
  set revoked_by = v_user_id,
      revoked_at = now()
  where id = v_closure_id;

  return v_closure_id;
end;
$$;

revoke all on function public.set_schedule_closure_updated_at() from public, anon;
revoke all on function public.enforce_schedule_closure_exclusion() from public, anon;
revoke all on function public.enforce_lesson_record_not_closed() from public, anon;
revoke all on function public.enforce_recorded_schedule_not_closed() from public, anon;
revoke all on function public.save_schedule_closure(uuid, text, timestamptz, text, text, boolean) from public, anon;
revoke all on function public.reopen_schedule_closure(uuid) from public, anon;

grant execute on function public.save_schedule_closure(uuid, text, timestamptz, text, text, boolean) to authenticated, service_role;
grant execute on function public.reopen_schedule_closure(uuid) to authenticated, service_role;
