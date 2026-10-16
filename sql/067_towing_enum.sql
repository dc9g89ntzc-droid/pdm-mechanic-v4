-- Towing, part 1 of 2 -- run this one first, on its own.
-- Postgres won't let a new enum value be used (even just referenced in an
-- insert's literal) in the same transaction that adds it -- "unsafe use of
-- new value... must be committed before they can be used" (same reason
-- sql/007 is just its own one-line enum add). sql/068_towing.sql, which
-- does everything else, depends on this value already being committed.

alter type job_type add value if not exists 'tow';
