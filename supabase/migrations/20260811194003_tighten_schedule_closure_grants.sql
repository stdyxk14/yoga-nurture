-- Keep Data API object privileges separate from RLS. Closure mutations still
-- run through SECURITY INVOKER RPCs, so authenticated needs only these three
-- table privileges; TRUNCATE/REFERENCES/TRIGGER must not be inherited.
revoke all on table public.schedule_closures from public, anon, authenticated;
grant select, insert, update on table public.schedule_closures to authenticated;
grant all on table public.schedule_closures to service_role;
