-- The shop's own pin on the towing hex map (towing.html) was a hardcoded
-- constant (SHOP_PIXEL), only ever adjustable per-browser via "Pick/move
-- pin" and never actually saved -- every driver's device started from the
-- same hardcoded guess and any correction lived only in that one session,
-- never shared. The shop's location never moves, so it belongs in the
-- database once, not in client code everyone can nudge independently.

create table if not exists shop_location (
  id integer primary key default 1,
  hex_q integer not null,
  hex_r integer not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references mechanic_employees(id)
);

-- Seeded at the same hex the old hardcoded SHOP_PIXEL constant resolved
-- to, so nothing visibly moves on deploy -- boss can now set the exact
-- spot via towing.html's "Pick/move pin" (now boss-only and persisted).
insert into shop_location (id, hex_q, hex_r) values (1, 5, 9)
on conflict (id) do nothing;

alter table shop_location enable row level security;

create policy "authenticated select shop_location" on shop_location for select to authenticated using (true);

-- Boss-only write, enforced at the database, not just hidden in the UI --
-- "it's never going to move" means no one else should be able to, even by
-- calling the table directly.
create policy "boss update shop_location" on shop_location for update to authenticated
  using (current_mechanic_role() = 'boss')
  with check (current_mechanic_role() = 'boss');

grant select, update on shop_location to authenticated;
