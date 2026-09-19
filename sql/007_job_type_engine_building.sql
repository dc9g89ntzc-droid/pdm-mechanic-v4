-- Engine building is time-intensive enough (and distinct enough from
-- bolt-on performance work) that it needs to be visible as its own job
-- type on the board, not folded into "performance".
alter type job_type add value if not exists 'engine_building';
