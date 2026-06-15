alter table public.lesson_record_students
  add column if not exists follow_up_status text not null default 'none',
  add column if not exists follow_up_completed_at timestamptz,
  add column if not exists follow_up_completed_note text,
  add column if not exists follow_up_updated_at timestamptz;

alter table public.lesson_record_students
  drop constraint if exists lesson_record_students_follow_up_status_check;

alter table public.lesson_record_students
  add constraint lesson_record_students_follow_up_status_check
  check (follow_up_status in ('none', 'pending', 'completed', 'dismissed'));

update public.lesson_record_students
set
  follow_up_status = case
    when coalesce(nullif(trim(next_follow), ''), '') <> '' and follow_up_status = 'none' then 'pending'
    when coalesce(nullif(trim(next_follow), ''), '') = '' then 'none'
    else follow_up_status
  end,
  follow_up_updated_at = coalesce(follow_up_updated_at, now())
where follow_up_updated_at is null
   or (coalesce(nullif(trim(next_follow), ''), '') <> '' and follow_up_status = 'none');

create index if not exists lesson_record_students_follow_up_status_idx
  on public.lesson_record_students (follow_up_status, updated_at desc);
