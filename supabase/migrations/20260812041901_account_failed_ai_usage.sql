-- Count billable model responses even when local validation or persistence fails.
-- Transport failures without response usage remain zero-cost in the internal ledger.

create or replace function public.claim_ai_review_scope_run(
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
      and (
        status in ('running', 'succeeded')
        or (status = 'failed' and estimated_cost_usd > 0)
      )
    union all
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_daily_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and (
        status in ('running', 'succeeded')
        or (status = 'failed' and estimated_cost_usd > 0)
      )
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

create or replace function public.claim_ai_daily_run(
  p_user_id uuid,
  p_suggestion_date date,
  p_source_review_snapshot_id uuid,
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
  v_existing public.ai_daily_runs%rowtype;
  v_run_id uuid;
  v_month_cost numeric := 0;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode = '42501', message = '[YN_AI_DAILY_SERVICE_REQUIRED] Service role is required.';
  end if;
  if p_source_fingerprint !~ '^[0-9a-f]{64}$'
     or p_trigger_type not in ('cron', 'manual', 'bootstrap')
     or p_reserved_cost_usd < 0
     or p_soft_budget_usd < 0
     or p_hard_budget_usd <= 0
     or p_soft_budget_usd > p_hard_budget_usd
     or not exists (
       select 1 from public.ai_review_snapshots s
       where s.id = p_source_review_snapshot_id and s.user_id = p_user_id
     ) then
    raise exception using errcode = '22023', message = '[YN_AI_DAILY_CLAIM_INVALID] Invalid daily suggestion claim.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-daily:' || p_user_id::text || ':' || p_suggestion_date::text, 0)
  );

  select r.* into v_existing
  from public.ai_daily_runs r
  where r.user_id = p_user_id
    and r.suggestion_date = p_suggestion_date
    and r.source_fingerprint = p_source_fingerprint
    and r.requested_model = p_requested_model
    and r.prompt_version = p_prompt_version
    and r.status = 'succeeded'
  order by r.completed_at desc
  limit 1;
  if found then
    return jsonb_build_object('decision', 'unchanged', 'run_id', v_existing.id, 'month_cost_usd', 0);
  end if;

  update public.ai_daily_runs
  set status = 'failed', error_code = 'stale_run',
      error_message = 'The previous run exceeded the claim timeout.', completed_at = now()
  where user_id = p_user_id and suggestion_date = p_suggestion_date
    and status = 'running' and started_at < now() - interval '15 minutes';

  select r.* into v_existing
  from public.ai_daily_runs r
  where r.user_id = p_user_id and r.suggestion_date = p_suggestion_date and r.status = 'running'
  limit 1;
  if found then
    return jsonb_build_object('decision', 'running', 'run_id', v_existing.id, 'month_cost_usd', 0);
  end if;

  select coalesce(sum(cost), 0) into v_month_cost
  from (
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_review_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and (
        status in ('running', 'succeeded')
        or (status = 'failed' and estimated_cost_usd > 0)
      )
    union all
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_daily_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and (
        status in ('running', 'succeeded')
        or (status = 'failed' and estimated_cost_usd > 0)
      )
  ) budget_rows;

  if v_month_cost + p_reserved_cost_usd > p_hard_budget_usd then
    return jsonb_build_object('decision', 'hard_budget', 'run_id', null, 'month_cost_usd', v_month_cost);
  end if;
  if p_trigger_type = 'cron' and v_month_cost >= p_soft_budget_usd then
    return jsonb_build_object('decision', 'soft_budget', 'run_id', null, 'month_cost_usd', v_month_cost);
  end if;

  insert into public.ai_daily_runs (
    user_id, suggestion_date, source_review_snapshot_id, source_fingerprint,
    status, trigger_type, requested_model, prompt_version, evidence_version,
    reserved_cost_usd
  ) values (
    p_user_id, p_suggestion_date, p_source_review_snapshot_id, p_source_fingerprint,
    'running', p_trigger_type, p_requested_model, p_prompt_version, p_evidence_version,
    p_reserved_cost_usd
  ) returning id into v_run_id;

  return jsonb_build_object('decision', 'claimed', 'run_id', v_run_id, 'month_cost_usd', v_month_cost);
end;
$$;

revoke all on function public.claim_ai_review_scope_run(uuid, text, text, text, uuid[], uuid, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.claim_ai_daily_run(uuid, date, uuid, text, text, text, text, text, numeric, numeric, numeric)
  from public, anon, authenticated;

grant execute on function public.claim_ai_review_scope_run(uuid, text, text, text, uuid[], uuid, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric)
  to service_role;
grant execute on function public.claim_ai_daily_run(uuid, date, uuid, text, text, text, text, text, numeric, numeric, numeric)
  to service_role;
