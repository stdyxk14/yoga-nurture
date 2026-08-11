alter table public.radar_runs
  drop constraint radar_runs_trigger_type_check,
  drop constraint radar_runs_search_limit_check,
  drop constraint radar_runs_reserved_search_count_check,
  drop constraint radar_runs_search_count_check,
  drop constraint radar_runs_item_limit_check,
  drop constraint radar_runs_item_count_check,
  drop constraint radar_runs_summary_limit_check,
  drop constraint radar_runs_summary_count_check;

alter table public.radar_runs
  add constraint radar_runs_trigger_type_check
    check (trigger_type in ('bootstrap', 'cron', 'manual', 'replenish')),
  add constraint radar_runs_search_limit_check
    check (search_limit between 0 and 4),
  add constraint radar_runs_reserved_search_count_check
    check (reserved_search_count between 0 and 4),
  add constraint radar_runs_search_count_check
    check (search_count between 0 and 4),
  add constraint radar_runs_item_limit_check
    check (item_limit between 0 and 12),
  add constraint radar_runs_item_count_check
    check (item_count between 0 and 12),
  add constraint radar_runs_summary_limit_check
    check (summary_limit between 0 and 12),
  add constraint radar_runs_summary_count_check
    check (summary_count between 0 and 12);

create or replace function public.claim_radar_replenishment(
  p_user_id uuid,
  p_run_key text,
  p_model text,
  p_prompt_version text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_settings public.radar_settings%rowtype;
  v_existing public.radar_runs%rowtype;
  v_run_id uuid;
  v_month_start timestamptz := (date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo');
  v_month_cost numeric(10, 6) := 0;
  v_search_limit integer := 4;
  v_item_limit integer := 12;
  v_summary_limit integer := 12;
  v_reserved_cost numeric(10, 6);
  v_decision text;
begin
  if p_user_id is null
     or nullif(btrim(p_run_key), '') is null
     or nullif(btrim(p_model), '') is null
     or nullif(btrim(p_prompt_version), '') is null then
    raise exception using errcode = '22023', message = '[YN_RADAR_REPLENISH_INVALID] Invalid radar replenishment claim.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('yoga-nurture-radar:' || p_user_id::text, 0));

  update public.radar_runs
  set status = 'failed',
      reserved_search_count = 0,
      reserved_cost_usd = 0,
      error_code = 'stale_run',
      error_message = 'The previous radar run did not finish within 15 minutes.',
      finished_at = now()
  where user_id = p_user_id
    and status = 'running'
    and started_at < now() - interval '15 minutes';

  insert into public.radar_settings(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_settings
  from public.radar_settings
  where user_id = p_user_id
  for update;

  select * into v_existing
  from public.radar_runs
  where user_id = p_user_id
    and run_key = p_run_key;

  if found then
    return jsonb_build_object(
      'decision', 'already_claimed',
      'run_id', v_existing.id,
      'status', v_existing.status,
      'search_limit', v_existing.search_limit,
      'item_limit', v_existing.item_limit,
      'summary_limit', v_existing.summary_limit
    );
  end if;

  select coalesce(sum(
    estimated_cost_usd + case when status = 'running' then reserved_cost_usd else 0 end
  ), 0)
  into v_month_cost
  from public.radar_runs
  where user_id = p_user_id
    and started_at >= v_month_start;

  if not v_settings.radar_enabled then
    v_decision := 'external_disabled';
  elsif v_month_cost >= v_settings.hard_budget_usd then
    v_decision := 'hard_budget';
  end if;

  if v_month_cost >= v_settings.soft_budget_usd then
    v_search_limit := 2;
    v_item_limit := 6;
    v_summary_limit := 6;
  end if;

  v_reserved_cost := (v_search_limit * 0.10) + (v_summary_limit * 0.01);
  if v_decision is null and v_month_cost + v_reserved_cost > v_settings.hard_budget_usd then
    v_decision := 'hard_budget';
  end if;

  if v_decision is not null then
    insert into public.radar_runs(
      user_id, run_key, trigger_type, status, model, prompt_version,
      error_code, finished_at
    )
    values (
      p_user_id, p_run_key, 'replenish', 'skipped', p_model, p_prompt_version,
      v_decision, now()
    )
    returning id into v_run_id;

    update public.radar_settings
    set last_run_at = now(), external_paused_reason = v_decision
    where user_id = p_user_id;

    return jsonb_build_object(
      'decision', v_decision,
      'run_id', v_run_id,
      'status', 'skipped',
      'search_limit', 0,
      'item_limit', 0,
      'summary_limit', 0,
      'month_cost_usd', v_month_cost
    );
  end if;

  insert into public.radar_runs(
    user_id, run_key, trigger_type, status,
    search_limit, item_limit, summary_limit,
    reserved_search_count, reserved_cost_usd,
    model, prompt_version
  )
  values (
    p_user_id, p_run_key, 'replenish', 'running',
    v_search_limit, v_item_limit, v_summary_limit,
    v_search_limit, v_reserved_cost,
    p_model, p_prompt_version
  )
  returning id into v_run_id;

  update public.radar_settings
  set last_run_at = now(), external_paused_reason = null
  where user_id = p_user_id;

  return jsonb_build_object(
    'decision', 'claimed',
    'run_id', v_run_id,
    'status', 'running',
    'search_limit', v_search_limit,
    'item_limit', v_item_limit,
    'summary_limit', v_summary_limit,
    'month_cost_usd', v_month_cost
  );
end;
$$;

revoke all on function public.claim_radar_replenishment(uuid, text, text, text) from public;
revoke all on function public.claim_radar_replenishment(uuid, text, text, text) from anon;
revoke all on function public.claim_radar_replenishment(uuid, text, text, text) from authenticated;
grant execute on function public.claim_radar_replenishment(uuid, text, text, text) to service_role;
