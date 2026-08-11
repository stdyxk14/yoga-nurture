revoke all on table public.radar_settings from public, anon, authenticated, service_role;
revoke all on table public.radar_topics from public, anon, authenticated, service_role;
revoke all on table public.radar_sources from public, anon, authenticated, service_role;
revoke all on table public.radar_runs from public, anon, authenticated, service_role;
revoke all on table public.radar_items from public, anon, authenticated, service_role;
revoke all on table public.radar_feedback from public, anon, authenticated, service_role;

grant select, insert, update on table public.radar_settings to authenticated;
grant select, insert, update on table public.radar_topics to authenticated;
grant select, update on table public.radar_sources to authenticated;
grant select on table public.radar_runs to authenticated;
grant select, update on table public.radar_items to authenticated;
grant select, insert, update on table public.radar_feedback to authenticated;

grant select, insert, update on table public.radar_settings to service_role;
grant select, insert, update on table public.radar_topics to service_role;
grant select, insert, update on table public.radar_sources to service_role;
grant select, insert, update on table public.radar_runs to service_role;
grant select, insert, update on table public.radar_items to service_role;
grant select, insert, update on table public.radar_feedback to service_role;
