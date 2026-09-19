-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Lets a signed-in mechanic change their OWN password -- distinct from
-- mechanic_reset_password (the Staff page's admin reset, gated behind
-- has_area_permission('staff')). Requires re-entering the current password
-- so a session left open at a workstation isn't enough on its own to change
-- it. Uses current_mechanic_id() (sql/025) to know who's actually calling,
-- so this only works with a real signed-in session, not the bare anon key.
create or replace function mechanic_change_own_password(p_current_password text, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid := current_mechanic_id();
  v_matches boolean;
begin
  if v_id is null then
    raise exception 'You must be signed in to change your password' using errcode = '28000';
  end if;

  select (password_hash = crypt(p_current_password, password_hash)) into v_matches
  from mechanic_employees
  where id = v_id;

  if v_matches is not true then
    raise exception 'Current password is incorrect' using errcode = '28P01';
  end if;

  update mechanic_employees
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = v_id;
end;
$$;

revoke all on function mechanic_change_own_password(text, text) from public;
grant execute on function mechanic_change_own_password(text, text) to authenticated;
