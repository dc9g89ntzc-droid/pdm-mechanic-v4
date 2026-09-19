-- Storage's list/download API is gated by RLS on storage.objects just like
-- any other table (same lesson as the customers/owned_vehicles grants miss
-- in 003_grants.sql) -- without this, sb.storage.from(...).list() silently
-- returns an empty array instead of an error, which is what happened when
-- probing the mechanic-item-icons bucket.
create policy "anon read mechanic-item-icons"
on storage.objects for select
to anon
using (bucket_id = 'mechanic-item-icons');
