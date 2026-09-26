-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Supports three of the "small UI/UX QOL fixes" Joanna asked for:
--
-- 1. New Job: customer-first flow, picking a vehicle from that customer's
--    real owned_vehicles instead of typing a registration. Some of those
--    vehicles (bought from the dealership, not yet plated in-game) genuinely
--    have no registration yet -- registration was `not null`, so make it
--    optional. The uniqueness rule only needs to hold among vehicles that
--    DO have a plate, so the unique index becomes a partial one (matches
--    this app's existing "unknown stays NULL, never a placeholder string"
--    convention -- see catalogue_items.customer_price etc).
alter table owned_vehicles alter column registration drop not null;

drop index if exists owned_vehicles_registration_key;
create unique index owned_vehicles_registration_key
  on owned_vehicles (upper(registration))
  where registration is not null;

-- 2. New Job: make/model soft-suggest for a new vehicle, against the
--    dealership's own stock catalog (sql/037 just backfilled make/model on
--    most of it). `vehicles` has RLS enabled with zero policies today (see
--    sql/002's header -- the dealership app reaches it via service-role
--    key/RPCs, never anon/authenticated), so the mechanic shop has never
--    been able to read it at all. This adds a read-only policy -- the
--    mechanic shop only ever needs to look up a model name here, never
--    create/edit dealership stock.
create policy "authenticated select vehicles" on vehicles for select to authenticated using (true);

-- 3. Catalogue: track whether a part is available at the Autoparts Store
--    and/or the Scrapyard, as real structured fields (today this only ever
--    existed as free text buried in a few items' `notes`, per sql/033's own
--    header). Nullable/false by default -- Joanna fills these in over time
--    via catalogue.html the same way every other catalogue field works
--    (admin-editable config, never hardcoded), not backfilled here since
--    that per-item sourcing data doesn't exist anywhere yet.
alter table catalogue_items add column if not exists available_autoparts boolean not null default false;
alter table catalogue_items add column if not exists available_scrapyard boolean not null default false;
