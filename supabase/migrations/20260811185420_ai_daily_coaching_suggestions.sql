-- Internal, evidence-based daily coaching suggestions and atomic draft creation.

alter table public.block_templates
  add column is_draft boolean not null default false;

create table public.ai_daily_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggestion_date date not null,
  source_review_snapshot_id uuid not null references public.ai_review_snapshots(id) on delete restrict,
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
  reference_index jsonb not null default '{}'::jsonb,
  evidence_summary jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_daily_runs_fingerprint_check check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint ai_daily_runs_reference_index_check check (jsonb_typeof(reference_index) = 'object'),
  constraint ai_daily_runs_evidence_summary_check check (jsonb_typeof(evidence_summary) = 'object')
);

create unique index ai_daily_runs_one_running_uidx
  on public.ai_daily_runs(user_id, suggestion_date)
  where status = 'running';

create unique index ai_daily_runs_success_fingerprint_uidx
  on public.ai_daily_runs(user_id, suggestion_date, source_fingerprint, requested_model, prompt_version)
  where status = 'succeeded';

create index ai_daily_runs_user_created_idx
  on public.ai_daily_runs(user_id, created_at desc);

create table public.ai_daily_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.ai_daily_runs(id) on delete restrict,
  suggestion_date date not null,
  rank integer not null check (rank between 1 and 3),
  suggestion_type text not null check (suggestion_type in (
    'new_plan', 'plan_revision', 'new_block', 'block_revision',
    'improvised_template', 'script_revision', 'alternative_block',
    'next_schedule_adaptation', 'observation_point', 'recording_improvement'
  )),
  candidate_key text not null,
  dedupe_key text not null,
  content_hash text not null,
  title text not null,
  summary text not null,
  rationale text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  includes_inference boolean not null default false,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  evidence_refs jsonb not null default '[]'::jsonb,
  draft_payload jsonb not null default '{}'::jsonb,
  source_plan_id uuid references public.lesson_plans(id) on delete set null,
  source_block_template_id uuid references public.block_templates(id) on delete set null,
  source_schedule_id uuid references public.schedules(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'held', 'dismissed', 'saved')),
  feedback_at timestamptz,
  saved_plan_id uuid references public.lesson_plans(id) on delete set null,
  saved_block_template_id uuid references public.block_templates(id) on delete set null,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_daily_suggestions_run_rank_unique unique (run_id, rank),
  constraint ai_daily_suggestions_dedupe_unique unique (user_id, dedupe_key),
  constraint ai_daily_suggestions_content_hash_check check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint ai_daily_suggestions_dedupe_key_check check (dedupe_key ~ '^[0-9a-f]{64}$'),
  constraint ai_daily_suggestions_refs_array_check check (jsonb_typeof(evidence_refs) = 'array'),
  constraint ai_daily_suggestions_draft_object_check check (jsonb_typeof(draft_payload) = 'object'),
  constraint ai_daily_suggestions_saved_state_check check (
    (status = 'saved' and saved_at is not null and num_nonnulls(saved_plan_id, saved_block_template_id) = 1)
    or (status <> 'saved' and saved_plan_id is null and saved_block_template_id is null and saved_at is null)
  )
);

create index ai_daily_suggestions_latest_idx
  on public.ai_daily_suggestions(user_id, suggestion_date desc, rank);

create index ai_daily_suggestions_status_idx
  on public.ai_daily_suggestions(user_id, status, created_at desc);

alter table public.lesson_plans
  add column source_ai_daily_suggestion_id uuid references public.ai_daily_suggestions(id) on delete set null;

alter table public.block_templates
  add column source_ai_daily_suggestion_id uuid references public.ai_daily_suggestions(id) on delete set null;

create unique index lesson_plans_ai_daily_source_uidx
  on public.lesson_plans(source_ai_daily_suggestion_id)
  where source_ai_daily_suggestion_id is not null;

create unique index block_templates_ai_daily_source_uidx
  on public.block_templates(source_ai_daily_suggestion_id)
  where source_ai_daily_suggestion_id is not null;

alter table public.ai_daily_runs enable row level security;
alter table public.ai_daily_suggestions enable row level security;

create policy "ai daily runs are readable by owner"
on public.ai_daily_runs for select to authenticated
using (user_id = (select auth.uid()));

create policy "ai daily suggestions are readable by owner"
on public.ai_daily_suggestions for select to authenticated
using (user_id = (select auth.uid()));

create policy "ai daily suggestion feedback follows owner"
on public.ai_daily_suggestions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table public.ai_daily_runs from public, anon, authenticated;
revoke all on table public.ai_daily_suggestions from public, anon, authenticated;
grant select on table public.ai_daily_runs to authenticated;
grant select on table public.ai_daily_suggestions to authenticated;
grant update (status, feedback_at, saved_plan_id, saved_block_template_id, saved_at, updated_at)
  on table public.ai_daily_suggestions to authenticated;
grant all on table public.ai_daily_runs to service_role;
grant all on table public.ai_daily_suggestions to service_role;

create trigger ai_daily_runs_set_updated_at
before update on public.ai_daily_runs
for each row execute function public.set_ai_review_updated_at();

create trigger ai_daily_suggestions_set_updated_at
before update on public.ai_daily_suggestions
for each row execute function public.set_ai_review_updated_at();

create function public.reject_draft_block_usage()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.block_template_id is not null and exists (
    select 1 from public.block_templates b
    where b.id = new.block_template_id and b.is_draft = true
  ) then
    raise exception using errcode = '23514', message = '[YN_AI_BLOCK_DRAFT_UNAVAILABLE] Confirm the AI-created block before using it.';
  end if;
  return new;
end;
$$;

create trigger lesson_plan_blocks_reject_draft_template
before insert or update of block_template_id on public.lesson_plan_blocks
for each row execute function public.reject_draft_block_usage();

create trigger lesson_record_blocks_reject_draft_template
before insert or update of block_template_id on public.lesson_record_blocks
for each row execute function public.reject_draft_block_usage();

create function public.claim_ai_daily_run(
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ai-daily:' || p_user_id::text || ':' || p_suggestion_date::text, 0));

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
      and status in ('running', 'succeeded')
    union all
    select case when status = 'running' then reserved_cost_usd else estimated_cost_usd end as cost
    from public.ai_daily_runs
    where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
      and status in ('running', 'succeeded')
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

create function public.complete_ai_daily_run(
  p_run_id uuid,
  p_status text,
  p_response_model text,
  p_input_tokens integer,
  p_cached_input_tokens integer,
  p_output_tokens integer,
  p_reasoning_output_tokens integer,
  p_estimated_cost_usd numeric,
  p_suggestions jsonb,
  p_reference_index jsonb,
  p_evidence_summary jsonb,
  p_error_code text,
  p_error_message text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_run public.ai_daily_runs%rowtype;
  v_inserted integer := 0;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode = '42501', message = '[YN_AI_DAILY_SERVICE_REQUIRED] Service role is required.';
  end if;
  if p_status not in ('succeeded', 'failed') then
    raise exception using errcode = '22023', message = '[YN_AI_DAILY_COMPLETE_INVALID] Invalid completion status.';
  end if;

  select r.* into v_run from public.ai_daily_runs r where r.id = p_run_id for update;
  if not found or v_run.status <> 'running' then
    raise exception using errcode = 'P0002', message = '[YN_AI_DAILY_RUN_NOT_RUNNING] Daily run is not running.';
  end if;

  if p_status = 'succeeded' then
    if jsonb_typeof(p_suggestions) <> 'array'
       or jsonb_array_length(p_suggestions) not between 1 and 3
       or jsonb_typeof(p_reference_index) <> 'object'
       or jsonb_typeof(p_evidence_summary) <> 'object'
       or (select count(*) from jsonb_array_elements(p_suggestions) item where (item->>'rank')::integer = 1) <> 1
       or exists (
         select 1 from jsonb_array_elements(p_suggestions) item
         where (item->>'rank')::integer not between 1 and 3
           or item->>'confidence' not in ('high', 'medium', 'low')
           or item->>'suggestion_type' not in (
             'new_plan', 'plan_revision', 'new_block', 'block_revision',
             'improvised_template', 'script_revision', 'alternative_block',
             'next_schedule_adaptation', 'observation_point', 'recording_improvement'
           )
           or item->>'dedupe_key' !~ '^[0-9a-f]{64}$'
           or item->>'content_hash' !~ '^[0-9a-f]{64}$'
           or jsonb_typeof(item->'evidence_refs') <> 'array'
           or jsonb_typeof(item->'draft_payload') <> 'object'
       ) then
      raise exception using errcode = '22023', message = '[YN_AI_DAILY_OUTPUT_INVALID] Daily suggestion output is invalid.';
    end if;

    insert into public.ai_daily_suggestions (
      user_id, run_id, suggestion_date, rank, suggestion_type, candidate_key,
      dedupe_key, content_hash, title, summary, rationale, confidence,
      includes_inference, evidence_count, evidence_refs, draft_payload,
      source_plan_id, source_block_template_id, source_schedule_id
    )
    select
      v_run.user_id, v_run.id, v_run.suggestion_date, (item->>'rank')::integer,
      item->>'suggestion_type', item->>'candidate_key', item->>'dedupe_key',
      item->>'content_hash', item->>'title', item->>'summary', item->>'rationale',
      item->>'confidence', coalesce((item->>'includes_inference')::boolean, false),
      coalesce((item->>'evidence_count')::integer, 0), item->'evidence_refs',
      item->'draft_payload', nullif(item->>'source_plan_id', '')::uuid,
      nullif(item->>'source_block_template_id', '')::uuid,
      nullif(item->>'source_schedule_id', '')::uuid
    from jsonb_array_elements(p_suggestions) item
    order by (item->>'rank')::integer;
    get diagnostics v_inserted = row_count;
  end if;

  update public.ai_daily_runs
  set status = p_status,
      response_model = case when p_status = 'succeeded' then p_response_model else null end,
      input_tokens = coalesce(p_input_tokens, 0),
      cached_input_tokens = coalesce(p_cached_input_tokens, 0),
      output_tokens = coalesce(p_output_tokens, 0),
      reasoning_output_tokens = coalesce(p_reasoning_output_tokens, 0),
      estimated_cost_usd = coalesce(p_estimated_cost_usd, 0),
      reference_index = case when p_status = 'succeeded' then p_reference_index else '{}'::jsonb end,
      evidence_summary = case when p_status = 'succeeded' then p_evidence_summary else '{}'::jsonb end,
      error_code = case when p_status = 'failed' then nullif(left(p_error_code, 120), '') else null end,
      error_message = case when p_status = 'failed' then nullif(left(p_error_message, 1000), '') else null end,
      completed_at = now()
  where id = p_run_id;

  return v_inserted;
end;
$$;

create function public.set_ai_daily_suggestion_status(p_suggestion_id uuid, p_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if p_status not in ('accepted', 'held', 'dismissed') then
    raise exception using errcode = '22023', message = '[YN_AI_DAILY_STATUS_INVALID] Invalid suggestion status.';
  end if;

  update public.ai_daily_suggestions
  set status = p_status, feedback_at = now(), updated_at = now()
  where id = p_suggestion_id and user_id = v_user_id and status <> 'saved';
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_AI_DAILY_SUGGESTION_UNAVAILABLE] Suggestion is unavailable.';
  end if;
end;
$$;

create function public.save_ai_daily_suggestion_as_block_draft(
  p_suggestion_id uuid,
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
  v_suggestion public.ai_daily_suggestions%rowtype;
  v_template_id uuid;
  v_tag text;
  v_tag_name text;
  v_tag_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if nullif(btrim(p_name), '') is null or p_duration_minutes is null or p_duration_minutes <= 0 then
    raise exception using errcode = '22023', message = '[YN_AI_BLOCK_DRAFT_INVALID] Name and positive duration are required.';
  end if;
  if p_category_id is not null and not exists (
    select 1 from public.block_categories c
    where c.id = p_category_id and c.user_id = v_user_id and c.archived = false
  ) then
    raise exception using errcode = '42501', message = '[YN_AI_BLOCK_CATEGORY_FORBIDDEN] Category is unavailable.';
  end if;
  if p_subcategory_id is not null and not exists (
    select 1 from public.block_subcategories c
    where c.id = p_subcategory_id and c.user_id = v_user_id and c.archived = false
      and (p_category_id is null or c.category_id = p_category_id)
  ) then
    raise exception using errcode = '42501', message = '[YN_AI_BLOCK_SUBCATEGORY_FORBIDDEN] Subcategory is unavailable.';
  end if;

  select s.* into v_suggestion
  from public.ai_daily_suggestions s
  where s.id = p_suggestion_id and s.user_id = v_user_id
  for update;
  if not found or v_suggestion.status = 'saved'
     or v_suggestion.saved_plan_id is not null or v_suggestion.saved_block_template_id is not null then
    raise exception using errcode = 'P0002', message = '[YN_AI_DAILY_SUGGESTION_ALREADY_SAVED] Suggestion is unavailable or already saved.';
  end if;
  if v_suggestion.status = 'dismissed' or v_suggestion.suggestion_type not in (
    'new_block', 'block_revision', 'improvised_template', 'script_revision', 'alternative_block'
  ) then
    raise exception using errcode = '22023', message = '[YN_AI_BLOCK_DRAFT_TYPE_INVALID] Suggestion cannot be saved as a block draft.';
  end if;

  insert into public.block_templates (
    user_id, category_id, subcategory_id, name, duration_minutes, purpose, level,
    script, cautions, memo, favorite, archived, is_draft, source_ai_daily_suggestion_id
  ) values (
    v_user_id, p_category_id, p_subcategory_id, btrim(p_name), p_duration_minutes,
    nullif(btrim(p_purpose), ''), nullif(btrim(p_level), ''), nullif(p_script, ''),
    nullif(p_cautions, ''), nullif(p_memo, ''), false, false, true, v_suggestion.id
  ) returning id into v_template_id;

  foreach v_tag in array coalesce(p_tags, '{}'::text[])
  loop
    v_tag_name := btrim(v_tag);
    if v_tag_name <> '' then
      if left(v_tag_name, 1) <> '#' then v_tag_name := '#' || v_tag_name; end if;
      insert into public.block_tags (user_id, name)
      values (v_user_id, v_tag_name)
      on conflict (user_id, name) do update set name = excluded.name
      returning id into v_tag_id;
      insert into public.block_template_tags (block_template_id, tag_id)
      values (v_template_id, v_tag_id) on conflict do nothing;
    end if;
  end loop;

  update public.ai_daily_suggestions
  set saved_block_template_id = v_template_id, status = 'saved', saved_at = now(),
      feedback_at = coalesce(feedback_at, now()), updated_at = now()
  where id = v_suggestion.id;

  return v_template_id;
end;
$$;

create function public.save_ai_daily_suggestion_as_plan_draft(
  p_suggestion_id uuid,
  p_name text,
  p_theme text,
  p_format text,
  p_memo text,
  p_blocks jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_suggestion public.ai_daily_suggestions%rowtype;
  v_plan_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;

  select s.* into v_suggestion
  from public.ai_daily_suggestions s
  where s.id = p_suggestion_id and s.user_id = v_user_id
  for update;
  if not found or v_suggestion.status = 'saved'
     or v_suggestion.saved_plan_id is not null or v_suggestion.saved_block_template_id is not null then
    raise exception using errcode = 'P0002', message = '[YN_AI_DAILY_SUGGESTION_ALREADY_SAVED] Suggestion is unavailable or already saved.';
  end if;
  if v_suggestion.status = 'dismissed' or v_suggestion.suggestion_type not in (
    'new_plan', 'plan_revision', 'next_schedule_adaptation'
  ) then
    raise exception using errcode = '22023', message = '[YN_AI_PLAN_DRAFT_TYPE_INVALID] Suggestion cannot be saved as a plan draft.';
  end if;

  v_plan_id := public.save_lesson_plan(null, p_name, p_theme, p_format, p_memo, 'draft', p_blocks);
  update public.lesson_plans
  set source_ai_daily_suggestion_id = v_suggestion.id, updated_at = now()
  where id = v_plan_id and user_id = v_user_id;

  update public.ai_daily_suggestions
  set saved_plan_id = v_plan_id, status = 'saved', saved_at = now(),
      feedback_at = coalesce(feedback_at, now()), updated_at = now()
  where id = v_suggestion.id;

  return v_plan_id;
end;
$$;

create function public.publish_ai_block_draft(p_block_template_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  update public.block_templates
  set is_draft = false, updated_at = now()
  where id = p_block_template_id and user_id = v_user_id
    and is_draft = true and source_ai_daily_suggestion_id is not null;
  if not found then
    raise exception using errcode = 'P0002', message = '[YN_AI_BLOCK_DRAFT_UNAVAILABLE] AI block draft is unavailable.';
  end if;
end;
$$;

revoke all on function public.reject_draft_block_usage() from public, anon, authenticated;
revoke all on function public.claim_ai_daily_run(uuid, date, uuid, text, text, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function public.complete_ai_daily_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.set_ai_daily_suggestion_status(uuid, text) from public, anon;
revoke all on function public.save_ai_daily_suggestion_as_block_draft(uuid, text, uuid, uuid, integer, text, text, text, text, text, text[]) from public, anon;
revoke all on function public.save_ai_daily_suggestion_as_plan_draft(uuid, text, text, text, text, jsonb) from public, anon;
revoke all on function public.publish_ai_block_draft(uuid) from public, anon;

grant execute on function public.claim_ai_daily_run(uuid, date, uuid, text, text, text, text, text, numeric, numeric, numeric) to service_role;
grant execute on function public.complete_ai_daily_run(uuid, text, text, integer, integer, integer, integer, numeric, jsonb, jsonb, jsonb, text, text) to service_role;
grant execute on function public.set_ai_daily_suggestion_status(uuid, text) to authenticated, service_role;
grant execute on function public.save_ai_daily_suggestion_as_block_draft(uuid, text, uuid, uuid, integer, text, text, text, text, text, text[]) to authenticated, service_role;
grant execute on function public.save_ai_daily_suggestion_as_plan_draft(uuid, text, text, text, text, jsonb) to authenticated, service_role;
grant execute on function public.publish_ai_block_draft(uuid) to authenticated, service_role;
