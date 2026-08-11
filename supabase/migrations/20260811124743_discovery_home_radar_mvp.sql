create table public.radar_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  radar_enabled boolean not null default true,
  active_topic_limit integer not null default 4 check (active_topic_limit between 1 and 4),
  daily_search_limit integer not null default 2 check (daily_search_limit between 0 and 2),
  daily_item_limit integer not null default 6 check (daily_item_limit between 0 and 6),
  daily_summary_limit integer not null default 4 check (daily_summary_limit between 0 and 4),
  manual_refresh_limit integer not null default 1 check (manual_refresh_limit between 0 and 1),
  soft_budget_usd numeric(10, 4) not null default 5 check (soft_budget_usd >= 0),
  hard_budget_usd numeric(10, 4) not null default 8 check (hard_budget_usd >= soft_budget_usd),
  last_manual_refresh_on date,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_code text,
  external_paused_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.radar_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null,
  label_ja text not null,
  label_en text not null,
  search_queries text[] not null default '{}',
  source_kind text not null default 'practice' check (source_kind in ('practice', 'safety', 'knowledge')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  priority numeric(6, 3) not null default 1 check (priority between 0 and 10),
  status text not null default 'active' check (status in ('active', 'blocked')),
  last_generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_key)
);

create table public.radar_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_key text not null,
  domain text not null,
  base_url text not null,
  name text not null,
  source_type text not null check (source_type in (
    'public_research',
    'medical_health',
    'yoga_organization',
    'yoga_expert',
    'general_article',
    'video',
    'social_signal'
  )),
  status text not null default 'candidate' check (status in ('candidate', 'active', 'blocked')),
  hit_count integer not null default 0 check (hit_count >= 0),
  high_relevance_count integer not null default 0 check (high_relevance_count >= 0),
  helpful_count integer not null default 0 check (helpful_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create table public.radar_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_key text not null,
  trigger_type text not null check (trigger_type in ('bootstrap', 'cron', 'manual')),
  status text not null default 'running' check (status in ('running', 'ready', 'failed', 'skipped')),
  search_limit integer not null default 0 check (search_limit between 0 and 2),
  item_limit integer not null default 0 check (item_limit between 0 and 6),
  summary_limit integer not null default 0 check (summary_limit between 0 and 4),
  reserved_search_count integer not null default 0 check (reserved_search_count between 0 and 2),
  reserved_cost_usd numeric(10, 6) not null default 0 check (reserved_cost_usd >= 0),
  search_count integer not null default 0 check (search_count between 0 and 2),
  item_count integer not null default 0 check (item_count between 0 and 6),
  summary_count integer not null default 0 check (summary_count between 0 and 4),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(10, 6) not null default 0 check (estimated_cost_usd >= 0),
  model text,
  prompt_version text,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, run_key)
);

create table public.radar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.radar_sources(id) on delete cascade,
  run_id uuid not null references public.radar_runs(id) on delete cascade,
  source_url text not null check (source_url ~* '^https?://'),
  normalized_url text not null check (normalized_url ~* '^https?://'),
  canonical_url text check (canonical_url is null or canonical_url ~* '^https?://'),
  original_title text not null,
  source_name text not null,
  author text,
  published_on date,
  retrieved_at timestamptz not null default now(),
  language text not null default 'ja' check (language in ('ja', 'en', 'other')),
  item_type text not null check (item_type in (
    'public_research',
    'medical_health',
    'yoga_organization',
    'yoga_expert',
    'general_article',
    'video',
    'social_signal'
  )),
  topic_keys text[] not null default '{}',
  ai_summary text not null,
  relevance_reason text not null,
  relevance_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(relevance_evidence) = 'object'),
  relevance_score numeric(5, 4) not null check (relevance_score between 0 and 1),
  trust_score numeric(5, 4) not null check (trust_score between 0 and 1),
  is_ai_summary boolean not null default true check (is_ai_summary),
  prompt_version text not null,
  model text not null,
  input_hash text not null,
  processing_status text not null default 'ready' check (processing_status in ('ready', 'failed')),
  visibility_status text not null default 'visible' check (visibility_status in ('visible', 'hidden')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_url)
);

create table public.radar_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.radar_items(id) on delete cascade,
  source_id uuid references public.radar_sources(id) on delete cascade,
  action text not null check (action in ('helpful', 'not_now', 'read_later', 'block_source')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id, action)
);

create index radar_topics_user_status_priority_idx
  on public.radar_topics(user_id, status, priority desc, updated_at desc);
create index radar_sources_user_status_seen_idx
  on public.radar_sources(user_id, status, last_seen_at desc);
create index radar_runs_user_started_idx
  on public.radar_runs(user_id, started_at desc);
create index radar_items_user_ready_idx
  on public.radar_items(user_id, processing_status, visibility_status, relevance_score desc, retrieved_at desc);
create index radar_items_source_id_idx on public.radar_items(source_id);
create index radar_items_run_id_idx on public.radar_items(run_id);
create index radar_feedback_item_id_idx on public.radar_feedback(item_id);
create index radar_feedback_source_id_idx on public.radar_feedback(source_id) where source_id is not null;

alter table public.radar_settings enable row level security;
alter table public.radar_topics enable row level security;
alter table public.radar_sources enable row level security;
alter table public.radar_runs enable row level security;
alter table public.radar_items enable row level security;
alter table public.radar_feedback enable row level security;

create policy "radar settings are owned by user"
on public.radar_settings for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "radar topics are owned by user"
on public.radar_topics for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "radar sources are owned by user"
on public.radar_sources for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "radar runs are owned by user"
on public.radar_runs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "radar items are owned by user"
on public.radar_items for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "radar feedback is owned by user"
on public.radar_feedback for all to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.radar_items ri
    where ri.id = item_id
      and ri.user_id = (select auth.uid())
  )
  and (
    source_id is null
    or exists (
      select 1
      from public.radar_sources rs
      where rs.id = source_id
        and rs.user_id = (select auth.uid())
    )
  )
);

create trigger radar_settings_set_updated_at
before update on public.radar_settings
for each row execute function public.set_updated_at();
create trigger radar_topics_set_updated_at
before update on public.radar_topics
for each row execute function public.set_updated_at();
create trigger radar_sources_set_updated_at
before update on public.radar_sources
for each row execute function public.set_updated_at();
create trigger radar_runs_set_updated_at
before update on public.radar_runs
for each row execute function public.set_updated_at();
create trigger radar_items_set_updated_at
before update on public.radar_items
for each row execute function public.set_updated_at();
create trigger radar_feedback_set_updated_at
before update on public.radar_feedback
for each row execute function public.set_updated_at();

create or replace function public.claim_radar_run(
  p_user_id uuid,
  p_trigger_type text,
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
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_today_start timestamptz := ((now() at time zone 'Asia/Tokyo')::date::timestamp at time zone 'Asia/Tokyo');
  v_month_start timestamptz := (date_trunc('month', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo');
  v_searches_used integer := 0;
  v_manual_runs integer := 0;
  v_month_cost numeric(10, 6) := 0;
  v_search_limit integer := 0;
  v_item_limit integer := 0;
  v_summary_limit integer := 0;
  v_reserved_cost numeric(10, 6) := 0;
  v_decision text;
begin
  if p_user_id is null
     or p_trigger_type not in ('bootstrap', 'cron', 'manual')
     or nullif(btrim(p_run_key), '') is null
     or nullif(btrim(p_model), '') is null
     or nullif(btrim(p_prompt_version), '') is null then
    raise exception using errcode = '22023', message = '[YN_RADAR_CLAIM_INVALID] Invalid radar run claim.';
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
    case when status = 'running' then reserved_search_count else search_count end
  ), 0)::integer
  into v_searches_used
  from public.radar_runs
  where user_id = p_user_id
    and started_at >= v_today_start;

  select count(*)::integer
  into v_manual_runs
  from public.radar_runs
  where user_id = p_user_id
    and trigger_type = 'manual'
    and started_at >= v_today_start
    and status <> 'skipped';

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
  elsif p_trigger_type = 'manual' and v_manual_runs >= v_settings.manual_refresh_limit then
    v_decision := 'manual_limit';
  elsif v_searches_used >= v_settings.daily_search_limit then
    v_decision := 'daily_limit';
  end if;

  if v_decision is not null then
    insert into public.radar_runs(
      user_id, run_key, trigger_type, status, model, prompt_version,
      error_code, finished_at
    )
    values (
      p_user_id, p_run_key, p_trigger_type, 'skipped', p_model, p_prompt_version,
      v_decision, now()
    )
    returning id into v_run_id;

    update public.radar_settings
    set last_run_at = now(),
        external_paused_reason = v_decision,
        last_manual_refresh_on = case
          when p_trigger_type = 'manual' then v_today
          else last_manual_refresh_on
        end
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

  v_search_limit := least(v_settings.daily_search_limit - v_searches_used, 2);
  if v_month_cost >= v_settings.soft_budget_usd then
    v_search_limit := least(v_search_limit, 1);
  end if;
  v_item_limit := case
    when p_trigger_type = 'bootstrap' then least(v_settings.daily_item_limit, 4)
    else v_settings.daily_item_limit
  end;
  v_summary_limit := least(v_settings.daily_summary_limit, 4);
  v_reserved_cost := (v_search_limit * 0.10) + (v_summary_limit * 0.01);

  if v_month_cost + v_reserved_cost > v_settings.hard_budget_usd then
    v_decision := 'hard_budget';
    insert into public.radar_runs(
      user_id, run_key, trigger_type, status, model, prompt_version,
      error_code, finished_at
    )
    values (
      p_user_id, p_run_key, p_trigger_type, 'skipped', p_model, p_prompt_version,
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
    p_user_id, p_run_key, p_trigger_type, 'running',
    v_search_limit, v_item_limit, v_summary_limit,
    v_search_limit, v_reserved_cost,
    p_model, p_prompt_version
  )
  returning id into v_run_id;

  update public.radar_settings
  set last_run_at = now(),
      external_paused_reason = null,
      last_manual_refresh_on = case
        when p_trigger_type = 'manual' then v_today
        else last_manual_refresh_on
      end
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

create or replace function public.save_radar_run_results(
  p_run_id uuid,
  p_status text,
  p_items jsonb,
  p_search_count integer,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_estimated_cost_usd numeric,
  p_error_code text default null,
  p_error_message text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_run public.radar_runs%rowtype;
  v_item jsonb;
  v_source public.radar_sources%rowtype;
  v_topic_keys text[];
  v_saved_count integer := 0;
  v_url text;
  v_normalized_url text;
  v_source_key text;
  v_source_type text;
  v_relevance numeric;
begin
  if p_status not in ('ready', 'failed')
     or p_search_count < 0
     or p_input_tokens < 0
     or p_output_tokens < 0
     or p_estimated_cost_usd < 0
     or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = '[YN_RADAR_RESULT_INVALID] Invalid radar result payload.';
  end if;

  select * into v_run
  from public.radar_runs
  where id = p_run_id
  for update;

  if not found or v_run.status <> 'running' then
    raise exception using errcode = 'P0002', message = '[YN_RADAR_RUN_NOT_RUNNING] Radar run was not found or is not running.';
  end if;

  if p_search_count > v_run.search_limit
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > v_run.item_limit
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > v_run.summary_limit then
    raise exception using errcode = '22023', message = '[YN_RADAR_LIMIT_EXCEEDED] Radar result exceeds the claimed limits.';
  end if;

  if p_status = 'ready' then
    for v_item in
      select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
    loop
      v_url := nullif(btrim(v_item->>'source_url'), '');
      v_normalized_url := nullif(btrim(v_item->>'normalized_url'), '');
      v_source_key := nullif(btrim(v_item->>'source_key'), '');
      v_source_type := nullif(btrim(v_item->>'source_type'), '');
      v_relevance := coalesce((v_item->>'relevance_score')::numeric, 0);

      if v_url is null
         or v_normalized_url is null
         or v_source_key is null
         or v_url !~* '^https?://'
         or v_normalized_url !~* '^https?://'
         or nullif(btrim(v_item->>'domain'), '') is null
         or nullif(btrim(v_item->>'source_name'), '') is null
         or nullif(btrim(v_item->>'original_title'), '') is null
         or nullif(btrim(v_item->>'ai_summary'), '') is null
         or nullif(btrim(v_item->>'relevance_reason'), '') is null
         or nullif(btrim(v_item->>'prompt_version'), '') is null
         or nullif(btrim(v_item->>'model'), '') is null
         or nullif(btrim(v_item->>'input_hash'), '') is null
         or v_source_type not in (
           'public_research', 'medical_health', 'yoga_organization', 'yoga_expert',
           'general_article', 'video', 'social_signal'
         )
         or v_relevance < 0
         or v_relevance > 1
         or coalesce((v_item->>'trust_score')::numeric, -1) < 0
         or coalesce((v_item->>'trust_score')::numeric, -1) > 1 then
        raise exception using errcode = '22023', message = '[YN_RADAR_ITEM_INVALID] Invalid radar item payload.';
      end if;

      insert into public.radar_sources(
        user_id, source_key, domain, base_url, name, source_type,
        status, hit_count, high_relevance_count, first_seen_at, last_seen_at
      )
      values (
        v_run.user_id,
        v_source_key,
        btrim(v_item->>'domain'),
        btrim(v_item->>'base_url'),
        btrim(v_item->>'source_name'),
        v_source_type,
        'candidate',
        1,
        case when v_relevance >= 0.72 then 1 else 0 end,
        now(),
        now()
      )
      on conflict (user_id, source_key) do update
      set domain = excluded.domain,
          base_url = excluded.base_url,
          name = excluded.name,
          source_type = excluded.source_type,
          hit_count = public.radar_sources.hit_count + 1,
          high_relevance_count = public.radar_sources.high_relevance_count + excluded.high_relevance_count,
          status = case
            when public.radar_sources.status = 'blocked' then 'blocked'
            when public.radar_sources.status = 'active'
              or public.radar_sources.high_relevance_count + excluded.high_relevance_count >= 2
            then 'active'
            else 'candidate'
          end,
          last_seen_at = now()
      returning * into v_source;

      if v_source.status = 'blocked' then
        continue;
      end if;

      select coalesce(array_agg(value), '{}'::text[])
      into v_topic_keys
      from jsonb_array_elements_text(coalesce(v_item->'topic_keys', '[]'::jsonb));

      insert into public.radar_items(
        user_id, source_id, run_id,
        source_url, normalized_url, canonical_url,
        original_title, source_name, author, published_on, retrieved_at,
        language, item_type, topic_keys,
        ai_summary, relevance_reason, relevance_evidence,
        relevance_score, trust_score, is_ai_summary,
        prompt_version, model, input_hash,
        processing_status, visibility_status, last_seen_at
      )
      values (
        v_run.user_id,
        v_source.id,
        v_run.id,
        v_url,
        v_normalized_url,
        nullif(btrim(v_item->>'canonical_url'), ''),
        btrim(v_item->>'original_title'),
        btrim(v_item->>'source_name'),
        nullif(btrim(v_item->>'author'), ''),
        nullif(v_item->>'published_on', '')::date,
        now(),
        case when v_item->>'language' in ('ja', 'en', 'other') then v_item->>'language' else 'other' end,
        v_source_type,
        v_topic_keys,
        btrim(v_item->>'ai_summary'),
        btrim(v_item->>'relevance_reason'),
        coalesce(v_item->'relevance_evidence', '{}'::jsonb),
        v_relevance,
        (v_item->>'trust_score')::numeric,
        true,
        btrim(v_item->>'prompt_version'),
        btrim(v_item->>'model'),
        btrim(v_item->>'input_hash'),
        'ready',
        'visible',
        now()
      )
      on conflict (user_id, normalized_url) do update
      set source_id = excluded.source_id,
          source_url = excluded.source_url,
          canonical_url = coalesce(excluded.canonical_url, public.radar_items.canonical_url),
          original_title = excluded.original_title,
          source_name = excluded.source_name,
          author = coalesce(excluded.author, public.radar_items.author),
          published_on = coalesce(excluded.published_on, public.radar_items.published_on),
          last_seen_at = now();

      v_saved_count := v_saved_count + 1;
    end loop;
  end if;

  update public.radar_runs
  set status = p_status,
      reserved_search_count = 0,
      reserved_cost_usd = 0,
      search_count = p_search_count,
      item_count = case when p_status = 'ready' then v_saved_count else 0 end,
      summary_count = case when p_status = 'ready' then v_saved_count else 0 end,
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      estimated_cost_usd = p_estimated_cost_usd,
      error_code = p_error_code,
      error_message = left(p_error_message, 500),
      finished_at = now()
  where id = p_run_id;

  update public.radar_settings
  set last_run_at = now(),
      last_success_at = case when p_status = 'ready' then now() else last_success_at end,
      last_error_at = case when p_status = 'failed' then now() else last_error_at end,
      last_error_code = case when p_status = 'failed' then p_error_code else null end,
      external_paused_reason = case when p_status = 'failed' then 'last_run_failed' else null end
  where user_id = v_run.user_id;

  return jsonb_build_object(
    'run_id', p_run_id,
    'status', p_status,
    'saved_count', v_saved_count,
    'search_count', p_search_count,
    'estimated_cost_usd', p_estimated_cost_usd
  );
end;
$$;

create or replace function public.apply_radar_feedback(
  p_item_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_item public.radar_items%rowtype;
  v_feedback_exists boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = '[YN_AUTH_REQUIRED] Authentication is required.';
  end if;
  if p_action not in ('helpful', 'not_now', 'read_later', 'block_source') then
    raise exception using errcode = '22023', message = '[YN_RADAR_FEEDBACK_INVALID] Invalid radar feedback action.';
  end if;

  select * into v_item
  from public.radar_items
  where id = p_item_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = '[YN_RADAR_ITEM_NOT_FOUND] Radar item was not found.';
  end if;

  select exists (
    select 1
    from public.radar_feedback
    where user_id = v_user_id
      and item_id = v_item.id
      and action = p_action
  ) into v_feedback_exists;

  insert into public.radar_feedback(user_id, item_id, source_id, action)
  values (v_user_id, v_item.id, v_item.source_id, p_action)
  on conflict (user_id, item_id, action) do update
  set source_id = excluded.source_id,
      updated_at = now();

  if not v_feedback_exists and p_action = 'helpful' then
    update public.radar_sources
    set helpful_count = helpful_count + 1,
        status = 'active'
    where id = v_item.source_id
      and user_id = v_user_id
      and status <> 'blocked';

    update public.radar_topics
    set priority = least(10, priority + 0.20)
    where user_id = v_user_id
      and topic_key = any(v_item.topic_keys)
      and status = 'active';
  elsif not v_feedback_exists and p_action = 'not_now' then
    update public.radar_items
    set visibility_status = 'hidden'
    where id = v_item.id
      and user_id = v_user_id;

    update public.radar_topics
    set priority = greatest(0, priority - 0.10)
    where user_id = v_user_id
      and topic_key = any(v_item.topic_keys)
      and status = 'active';
  elsif not v_feedback_exists and p_action = 'block_source' then
    update public.radar_sources
    set status = 'blocked'
    where id = v_item.source_id
      and user_id = v_user_id;

    update public.radar_items
    set visibility_status = 'hidden'
    where source_id = v_item.source_id
      and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'item_id', v_item.id,
    'source_id', v_item.source_id,
    'action', p_action
  );
end;
$$;

revoke all on table public.radar_settings from anon;
revoke all on table public.radar_topics from anon;
revoke all on table public.radar_sources from anon;
revoke all on table public.radar_runs from anon;
revoke all on table public.radar_items from anon;
revoke all on table public.radar_feedback from anon;

grant select, insert, update on table public.radar_settings to authenticated;
grant select, insert, update on table public.radar_topics to authenticated;
grant select, update on table public.radar_sources to authenticated;
grant select on table public.radar_runs to authenticated;
grant select, update on table public.radar_items to authenticated;
grant select, insert, update on table public.radar_feedback to authenticated;

grant select, insert, update, delete on table public.radar_settings to service_role;
grant select, insert, update, delete on table public.radar_topics to service_role;
grant select, insert, update, delete on table public.radar_sources to service_role;
grant select, insert, update, delete on table public.radar_runs to service_role;
grant select, insert, update, delete on table public.radar_items to service_role;
grant select, insert, update, delete on table public.radar_feedback to service_role;

revoke execute on function public.claim_radar_run(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_radar_run(uuid, text, text, text, text) to service_role;

revoke execute on function public.save_radar_run_results(uuid, text, jsonb, integer, bigint, bigint, numeric, text, text) from public, anon, authenticated;
grant execute on function public.save_radar_run_results(uuid, text, jsonb, integer, bigint, bigint, numeric, text, text) to service_role;

revoke execute on function public.apply_radar_feedback(uuid, text) from public, anon;
grant execute on function public.apply_radar_feedback(uuid, text) to authenticated, service_role;
