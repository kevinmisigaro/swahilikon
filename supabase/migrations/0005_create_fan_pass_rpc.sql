-- Swahili Komik Con — fix Fan Pass creation.
--
-- The anon/public client can INSERT into fan_passes ("anyone creates a fan
-- pass"), but the only SELECT policy on that table is admin-only
-- ("admins read fan passes"). The API route creates a pass with
-- `.insert({...}).select(...).single()`, and PostgREST enforces the SELECT
-- policy on that read-back too — so for any non-admin visitor the insert
-- succeeds but the read-back is blocked by RLS, and the route reports a
-- generic creation failure.
--
-- Fix: do the insert through a SECURITY DEFINER RPC, the same pattern
-- already used for get_fan_pass/get_quest_status/link_fan_pass_to_profile,
-- so the write and the read-back both run with elevated privilege instead
-- of depending on the caller's own SELECT grant.
create or replace function create_fan_pass(
  p_holder_name text,
  p_holder_email text default null
)
returns table (
  pass_code text,
  holder_name text,
  xp integer,
  badge text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(p_holder_name);
  v_email text := nullif(trim(coalesce(p_holder_email, '')), '');
begin
  if v_name = '' then
    raise exception 'holder_name_required' using errcode = 'P0001';
  end if;

  return query
    insert into fan_passes (holder_name, holder_email)
    values (v_name, v_email)
    returning fan_passes.pass_code, fan_passes.holder_name, fan_passes.xp,
      fan_passes.badge, fan_passes.created_at;
end;
$$;

grant execute on function create_fan_pass(text, text) to anon, authenticated;
