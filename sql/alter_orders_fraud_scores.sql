-- Run once on existing Postgres / Supabase projects created before fraud scoring columns existed.

alter table orders add column if not exists fraud_probability numeric;
alter table orders add column if not exists fraud_predicted boolean;
alter table orders add column if not exists fraud_scored_at timestamptz;
