-- Evidence-based teaching review runs and immutable successful snapshots.

create table public.ai_review_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_days integer not null check (period_days in (30, 90)),
  period_start timestamptz not null,
  period_end timestamptz not null,
  source_fingerprint text not null,
  status text not null check (status in ('running', 'succeeded', 'failed', 'skipped')),
  trigger_type text not null check (trigger_type in ('cron', 'manual', 'bootstrap')),
  requested_model text not null,
  response_model text,
  prompt_version text not null,
  evidence_version text not null,
  reserved_cost_usd numeric(10, 6) not null default 0 check (reserved_cost_usd >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  reasoning_output_tokens integer not null default 0 check (reasoning_output_tokens >= 0),
  estimated_cost_usd numeric(10, 6) not null default 0 check (estimated_cost_usd >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_review_runs_period_check check (period_start < period_end),
  constraint ai_review_runs_fingerprint_check check (source_fingerprint ~ '^[0-9a-f]{64}$')
);

create unique index ai_review_runs_one_running_uidx
  on public.ai_review_runs(user_id, period_days)
  where status = 'running';

create unique index ai_review_runs_success_fingerprint_uidx
  on public.ai_review_runs(user_id, period_days, source_fingerprint, requested_model, prompt_version)
  where status = 'succeeded';

create index ai_review_runs_user_created_idx
  on public.ai_review_runs(user_id, created_at desc);

create index ai_review_runs_user_month_cost_idx
  on public.ai_review_runs(user_id, created_at desc, status);

create table public.ai_review_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null unique references public.ai_review_runs(id) on delete restrict,
  period_days integer not null check (period_days in (30, 90)),
  period_start timestamptz not null,
  period_end timestamptz not null,
  source_fingerprint text not null,
  model text not null,
  prompt_version text not null,
  evidence_version text not null,
  overall_assessment text not null,
  key_strength jsonb not null,
  priority_improvement jsonb not null,
  lesson_plan_analysis jsonb not null,
  block_analysis jsonb not null,
  student_safety_analysis jsonb not null,
  data_quality jsonb not null,
  next_actions jsonb not null,
  axes jsonb not null,
  contradictions jsonb not null,
  reference_index jsonb not null,
  evidence_summary jsonb not null,
  review jsonb not null,
  input_tokens integer not null default 0,
  cached_input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  reasoning_output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_review_snapshots_fingerprint_check check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint ai_review_snapshots_review_object_check check (jsonb_typeof(review) = 'object'),
  constraint ai_review_snapshots_axes_array_check check (jsonb_typeof(axes) = 'array'),
  constraint ai_review_snapshots_references_object_check check (jsonb_typeof(reference_index) = 'object')
);

create index ai_review_snapshots_latest_idx
  on public.ai_review_snapshots(user_id, period_days, generated_at desc);

alter table public.ai_review_runs enable row level security;
alter table public.ai_review_snapshots enable row level security;

create policy "ai review runs are readable by owner"
on public.ai_review_runs for select to authenticated
using (user_id = (select auth.uid()));

create policy "ai review snapshots are readable by owner"
on public.ai_review_snapshots for select to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.ai_review_runs from public, anon, authenticated;
revoke all on table public.ai_review_snapshots from public, anon, authenticated;
grant select on table public.ai_review_runs to authenticated;
grant select on table public.ai_review_snapshots to authenticated;
grant all on table public.ai_review_runs to service_role;
grant all on table public.ai_review_snapshots to service_role;

-- Tighten the closure table's object grant. RLS already denied DELETE, but the
-- role should not retain an unnecessary Data API privilege.
revoke delete on table public.schedule_closures from authenticated;

create function public.set_ai_review_updated_at()
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

create trigger ai_review_runs_set_updated_at
before update on public.ai_review_runs
for each row execute function public.set_ai_review_updated_at();

create trigger ai_review_snapshots_set_updated_at
before update on public.ai_review_snapshots
for each row execute function public.set_ai_review_updated_at();

create function public.claim_ai_review_run(
  p_user_id uuid,
  p_period_days integer,
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
  if p_period_days not in (30, 90)
     or p_period_start >= p_period_end
     or p_source_fingerprint !~ '^[0-9a-f]{64}$'
     or p_trigger_type not in ('cron', 'manual', 'bootstrap')
     or p_reserved_cost_usd < 0
     or p_soft_budget_usd < 0
     or p_hard_budget_usd <= 0
     or p_soft_budget_usd > p_hard_budget_usd then
    raise exception using errcode = '22023', message = '[YN_AI_REVIEW_CLAIM_INVALID] Invalid review claim.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ai-review:' || p_user_id::text || ':' || p_period_days::text, 0));

  select r.* into v_existing
  from public.ai_review_runs r
  where r.user_id = p_user_id
    and r.period_days = p_period_days
    and r.source_fingerprint = p_source_fingerprint
    and r.requested_model = p_requested_model
    and r.prompt_version = p_prompt_version
    and r.status = 'succeeded'
  order by r.completed_at desc
  limit 1;

  if found then
    select s.id into v_snapshot_id from public.ai_review_snapshots s where s.run_id = v_existing.id;
    return jsonb_build_object('decision', 'unchanged', 'run_id', v_existing.id, 'snapshot_id', v_snapshot_id, 'month_cost_usd', 0);
  end if;

  update public.ai_review_runs
  set status = 'failed',
      error_code = 'stale_run',
      error_message = 'The previous run exceeded the claim timeout.',
      completed_at = now()
  where user_id = p_user_id
    and period_days = p_period_days
    and status = 'running'
    and started_at < now() - interval '20 minutes';

  select r.* into v_existing
  from public.ai_review_runs r
  where r.user_id = p_user_id
    and r.period_days = p_period_days
    and r.status = 'running'
  limit 1;
  if found then
    return jsonb_build_object('decision', 'running', 'run_id', v_existing.id, 'snapshot_id', null, 'month_cost_usd', 0);
  end if;

  select coalesce(sum(case when status = 'running' then reserved_cost_usd else estimated_cost_usd end), 0)
  into v_month_cost
  from public.ai_review_runs
  where user_id = p_user_id
    and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
    and status in ('running', 'succeeded');

  if v_month_cost + p_reserved_cost_usd > p_hard_budget_usd then
    return jsonb_build_object('decision', 'hard_budget', 'run_id', null, 'snapshot_id', null, 'month_cost_usd', v_month_cost);
  end if;
  if p_trigger_type = 'cron' and v_month_cost >= p_soft_budget_usd then
    return jsonb_build_object('decision', 'soft_budget', 'run_id', null, 'snapshot_id', null, 'month_cost_usd', v_month_cost);
  end if;

  insert into public.ai_review_runs (
    user_id, period_days, period_start, period_end, source_fingerprint,
    status, trigger_type, requested_model, prompt_version, evidence_version,
    reserved_cost_usd
  ) values (
    p_user_id, p_period_days, p_period_start, p_period_end, p_source_fingerprint,
    'running', p_trigger_type, p_requested_model, p_prompt_version, p_evidence_version,
    p_reserved_cost_usd
  ) returning id into v_run_id;

  return jsonb_build_object('decision', 'claimed', 'run_id', v_run_id, 'snapshot_id', null, 'month_cost_usd', v_month_cost);
end;
$$;

create function public.complete_ai_review_run(
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
    if jsonb_typeof(p_review) <> 'object'
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
      output_tokens, reasoning_output_tokens, estimated_cost_usd
    ) values (
      v_run.user_id, v_run.id, v_run.period_days, v_run.period_start, v_run.period_end,
      v_run.source_fingerprint, p_response_model, v_run.prompt_version, v_run.evidence_version,
      p_review->>'overall_assessment', p_review->'key_strength', p_review->'priority_improvement',
      p_review->'lesson_plan_analysis', p_review->'block_analysis', p_review->'student_safety_analysis',
      p_review->'data_quality', p_review->'next_actions', p_review->'axes', p_review->'contradictions',
      p_references, p_evidence_summary, p_review, coalesce(p_input_tokens, 0),
      coalesce(p_cached_input_tokens, 0), coalesce(p_output_tokens, 0),
      coalesce(p_reasoning_output_tokens, 0), coalesce(p_estimated_cost_usd, 0)
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

revoke all on function public.set_ai_review_updated_at() from public, anon, authenticated;
revoke all on function public.claim_ai_review_run(uuid, integer, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function public.complete_ai_review_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.claim_ai_review_run(uuid, integer, timestamptz, timestamptz, text, text, text, text, text, numeric, numeric, numeric) to service_role;
grant execute on function public.complete_ai_review_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text) to service_role;
