-- Real catalogue data surfaced two gaps in the first version of this
-- schema: items that legitimately belong to more than one category at
-- once (e.g. "Front Fender" is both Repair/Service and Customisation),
-- and categories that aren't job types at all (Tools, Aircraft -- shop
-- equipment and a vehicle domain, neither of which belongs on the job
-- board's job_type filter). Catalogue categories were always meant to be
-- reconfigurable (the "configurator" requirement), so they shouldn't live
-- in a fixed enum -- switch to a free-form tag array, same pattern as
-- end_uses. job_type / jobs.job_types are untouched; this only affects
-- how catalogue_items are categorised for browsing.
alter table catalogue_items add column if not exists categories text[] not null default '{}';
update catalogue_items set categories = array[category::text] where category is not null and categories = '{}';
alter table catalogue_items drop column if exists category;
drop index if exists catalogue_items_category_idx;
create index if not exists catalogue_items_categories_idx on catalogue_items using gin (categories);

-- Seed data included fractional minute values (e.g. 0.1) -- widen these
-- from integer to numeric so real values aren't silently truncated to 0.
alter table catalogue_items alter column craft_time_minutes type numeric(10,2);
alter table catalogue_items alter column install_time_minutes type numeric(10,2);
