-- Flexible, user-triggered single-lesson and multi-lesson teaching reviews.
-- Existing 30/90-day runs and snapshots remain as legacy data.

alter table public.ai_review_runs
  add column scope_type text not null default 'legacy_period',
  add column scope_key text,
  add column scope_label text not null default '',
  add column target_record_ids uuid[] not null default '{}'::uuid[],
  add column lesson_record_id uuid references public.lesson_records(id) on delete restrict;

alter table public.ai_review_snapshots
  add column scope_type text not null default 'legacy_period',
  add column scope_key text,
  add column scope_label text not null default '',
  add column target_record_ids uuid[] not null default '{}'::uuid[],
  add column lesson_record_id uuid references public.lesson_records(id) on delete restrict;

update public.ai_review_runs
set scope_key = 'legacy:' || period_days::text,
    scope_label = period_days::text || '日（旧レビュー）'
where scope_key is null;

update public.ai_review_snapshots
set scope_key = 'legacy:' || period_days::text,
    scope_label = period_days::text || '日（旧レビュー）'
where scope_key is null;

alter table public.ai_review_runs
  drop constraint ai_review_runs_period_days_check,
  alter column period_days drop not null,
  add constraint ai_review_runs_scope_type_check
    check (scope_type in ('legacy_period', 'lesson', 'recent', 'month', 'custom')),
  add constraint ai_review_runs_scope_metadata_check
    check (
      scope_type = 'legacy_period'
      or (
        nullif(btrim(scope_key), '') is not null
        and cardinality(target_record_ids) between 1 and 100
        and (
          (scope_type = 'lesson' and lesson_record_id is not null and cardinality(target_record_ids) = 1 and target_record_ids[1] = lesson_record_id)
          or (scope_type <> 'lesson' and lesson_record_id is null)
        )
      )
    );

alter table public.ai_review_snapshots
  drop constraint ai_review_snapshots_period_days_check,
  alter column period_days drop not null,
  add constraint ai_review_snapshots_scope_type_check
    check (scope_type in ('legacy_period', 'lesson', 'recent', 'month', 'custom')),
  add constraint ai_review_snapshots_scope_metadata_check
    check (
      scope_type = 'legacy_period'
      or (
        nullif(btrim(scope_key), '') is not null
        and cardinality(target_record_ids) between 1 and 100
        and (
          (scope_type = 'lesson' and lesson_record_id is not null and cardinality(target_record_ids) = 1 and target_record_ids[1] = lesson_record_id)
          or (scope_type <> 'lesson' and lesson_record_id is null)
        )
      )
    );

create unique index ai_review_runs_scope_running_uidx
  on public.ai_review_runs(user_id, scope_key)
  where status = 'running' and scope_key is not null;

create unique index ai_review_runs_scope_success_uidx
  on public.ai_review_runs(user_id, scope_key, source_fingerprint, requested_model, prompt_version)
  where status = 'succeeded' and scope_key is not null;

create index ai_review_snapshots_scope_latest_idx
  on public.ai_review_snapshots(user_id, scope_key, generated_at desc)
  where scope_key is not null;

create function public.claim_ai_review_scope_run(
  p_user_id uuid,
  p_scope_type text,
  p_scope_key text,
  p_scope_label text,
  p_target_record_ids uuid[],
  p_lesson_record_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_source_fingerprint text,
  p_requested_model text,
  p_prompt_version text,
  p_evidence_version text,
  p_trigger_type text,
  p_reserved_cost_usd numeric,
  p_soft_budget_usd numeric,
  p_hard_budget_usd numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.ai_review_runs%rowtype;
  v_run_id uuid;
  v_snapshot_id uuid;
  v_month_cost numeric := 0;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode = '42501', message = '[YN_AI_REVIEW_SERVICE_REQUIRED] Service role is required.';
  end if;
  if p_scope_type not in ('lesson', 'recent', 'month', 'custom')
     or nullif(btrim(p_scope_key), '') is null
     or length(p_scope_key) > 180
     or cardinality(p_target_record_ids) not between 1 and 100
     or p_period_start >= p_period_end
     or p_source_fingerprint !~ '^[0-9a-f]{64}$'
     or p_trigger_type not in ('manual', 'bootstrap')
     or p_reserved_cost_usd < 0
     or p_soft_budget_usd < 0
     or p_hard_budget_usd <= 0
     or p_soft_budget_usd > p_hard_budget_usd
     or (p_scope_type = 'lesson' and (
       p_lesson_record_id is null
       or cardinality(p_target_record_ids) <> 1
       or p_target_record_ids[1] <> p_lesson_record_id
     ))
     or (p_scope_type <> 'lesson' and p_lesson_record_id is not null)
     or exists (
       select 1
       from unnest(p_target_record_ids) target(record_id)
       left join public.lesson_records lr on lr.id = target.record_id
       left join public.schedules s on s.id = lr.schedule_id
       where lr.id is null
          or lr.user_id <> p_user_id
          or s.id is null
          or s.user_id <> p_user_id
          or s.status <> 'recorded'
          or exists (
            select 1 from public.schedule_closures c
            where c.schedule_id = s.id and c.revoked_at is null
          )
     ) then
    raise exception using errcode = '22023', message = '[YN_AI_REVIEW_SCOPE_INVALID] Invalid review scope claim.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-review-scope:' || p_user_id::text || ':' || p_scope_key, 0)
  );

  select r.* into v_existing
  from public.ai_review_runs r
  where r.user_id = p_user_id
    and r.scope_key = p_scope_key
    and r.source_fingerprint = p_source_fingerprint
    and r.requested_model = p_requested_model
    and r.prompt_version = p_prompt_version
    and r.status = 'succeeded'
  order by r.completed_at desc
  limit 1;

  if found then
    select s.id into v_snapshot_id
    from public.ai_review_snapshots s
    where s.run_id = v_existing.id;
    return jsonb_build_object(
      'decision', 'unchanged',
      'run_id', v_existing.id,
      'snapshot_id', v_snapshot_id,
      'month_cost_usd', 0
    );
  end if;

  update public.ai_review_runs
  set status = 'failed',
      error_code = 'stale_run',
      error_message = 'The previous run exceeded the claim timeout.',
      completed_at = now()
  where user_id = p_user_id
    and scope_key = p_scope_key
    and status = 'running'
    and started_at < now() - interval '20 minutes';

  select r.* into v_existing
  from public.ai_review_runs r
  where r.user_id = p_user_id
    and r.scope_key = p_scope_key
    and r.status = 'running'
  limit 1;
  if found then
    return jsonb_build_object('decision', 'running', 'run_id', v_existing.id, 'snapshot_id', null, 'month_cost_usd', 0);
  end if;

  select coalesce(sum(cost), 0) into v_month_cost
  from (
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_review_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and status in ('running', 'succeeded')
    union all
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_daily_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and status in ('running', 'succeeded')
  ) budget_rows;

  if v_month_cost + p_reserved_cost_usd > p_hard_budget_usd then
    return jsonb_build_object('decision', 'hard_budget', 'run_id', null, 'snapshot_id', null, 'month_cost_usd', v_month_cost);
  end if;

  insert into public.ai_review_runs (
    user_id, period_days, period_start, period_end, source_fingerprint,
    status, trigger_type, requested_model, prompt_version, evidence_version,
    reserved_cost_usd, scope_type, scope_key, scope_label, target_record_ids,
    lesson_record_id
  ) values (
    p_user_id, null, p_period_start, p_period_end, p_source_fingerprint,
    'running', p_trigger_type, p_requested_model, p_prompt_version, p_evidence_version,
    p_reserved_cost_usd, p_scope_type, p_scope_key, left(coalesce(p_scope_label, ''), 180),
    p_target_record_ids, p_lesson_record_id
  ) returning id into v_run_id;

  return jsonb_build_object('decision', 'claimed', 'run_id', v_run_id, 'snapshot_id', null, 'month_cost_usd', v_month_cost);
end;
$$;

create or replace function public.complete_ai_review_run(
  p_run_id uuid,
  p_status text,
  p_response_model text,
  p_input_tokens integer,
  p_cached_input_tokens integer,
  p_output_tokens integer,
  p_reasoning_output_tokens integer,
  p_estimated_cost_usd numeric,
  p_review jsonb,
  p_references jsonb,
  p_evidence_summary jsonb,
  p_error_code text,
  p_error_message text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_run public.ai_review_runs%rowtype;
  v_snapshot_id uuid;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode = '42501', message = '[YN_AI_REVIEW_SERVICE_REQUIRED] Service role is required.';
  end if;
  if p_status not in ('succeeded', 'failed') then
    raise exception using errcode = '22023', message = '[YN_AI_REVIEW_COMPLETE_INVALID] Invalid completion status.';
  end if;

  select r.* into v_run
  from public.ai_review_runs r
  where r.id = p_run_id
  for update;
  if not found or v_run.status <> 'running' then
    raise exception using errcode = 'P0002', message = '[YN_AI_REVIEW_RUN_NOT_RUNNING] Review run is not running.';
  end if;

  if p_status = 'succeeded' then
    if nullif(btrim(p_response_model), '') is null
       or jsonb_typeof(p_review) <> 'object'
       or jsonb_typeof(p_references) <> 'object'
       or jsonb_typeof(p_evidence_summary) <> 'object' then
      raise exception using errcode = '22023', message = '[YN_AI_REVIEW_OUTPUT_INVALID] Review output is invalid.';
    end if;

    insert into public.ai_review_snapshots (
      user_id, run_id, period_days, period_start, period_end, source_fingerprint,
      model, prompt_version, evidence_version, overall_assessment, key_strength,
      priority_improvement, lesson_plan_analysis, block_analysis,
      student_safety_analysis, data_quality, next_actions, axes, contradictions,
      reference_index, evidence_summary, review, input_tokens, cached_input_tokens,
      output_tokens, reasoning_output_tokens, estimated_cost_usd, scope_type,
      scope_key, scope_label, target_record_ids, lesson_record_id
    ) values (
      v_run.user_id, v_run.id, v_run.period_days, v_run.period_start, v_run.period_end,
      v_run.source_fingerprint, p_response_model, v_run.prompt_version, v_run.evidence_version,
      coalesce(p_review->>'overall_assessment', ''), coalesce(p_review->'key_strength', '{}'::jsonb),
      coalesce(p_review->'priority_improvement', '{}'::jsonb),
      coalesce(p_review->'lesson_plan_analysis', '[]'::jsonb),
      coalesce(p_review->'block_analysis', '[]'::jsonb),
      coalesce(p_review->'student_safety_analysis', '[]'::jsonb),
      coalesce(p_review->'data_quality', '{}'::jsonb),
      coalesce(p_review->'next_actions', '[]'::jsonb),
      coalesce(p_review->'axes', '[]'::jsonb),
      coalesce(p_review->'contradictions', '[]'::jsonb),
      p_references, p_evidence_summary, p_review, coalesce(p_input_tokens, 0),
      coalesce(p_cached_input_tokens, 0), coalesce(p_output_tokens, 0),
      coalesce(p_reasoning_output_tokens, 0), coalesce(p_estimated_cost_usd, 0),
      v_run.scope_type, v_run.scope_key, v_run.scope_label, v_run.target_record_ids,
      v_run.lesson_record_id
    ) returning id into v_snapshot_id;
  end if;

  update public.ai_review_runs
  set status = p_status,
      response_model = case when p_status = 'succeeded' then p_response_model else null end,
      input_tokens = coalesce(p_input_tokens, 0),
      cached_input_tokens = coalesce(p_cached_input_tokens, 0),
      output_tokens = coalesce(p_output_tokens, 0),
      reasoning_output_tokens = coalesce(p_reasoning_output_tokens, 0),
      estimated_cost_usd = coalesce(p_estimated_cost_usd, 0),
      error_code = case when p_status = 'failed' then nullif(left(p_error_code, 120), '') else null end,
      error_message = case when p_status = 'failed' then nullif(left(p_error_message, 1000), '') else null end,
      completed_at = now()
  where id = p_run_id;

  return v_snapshot_id;
end;
$$;

revoke all on function public.claim_ai_review_scope_run(uuid, text, text, text, uuid[], uuid, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.complete_ai_review_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text)
  from public, anon, authenticated;

grant execute on function public.claim_ai_review_scope_run(uuid, text, text, text, uuid[], uuid, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric)
  to service_role;
grant execute on function public.complete_ai_review_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text)
  to service_role;
