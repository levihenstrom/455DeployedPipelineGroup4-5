ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fraud_predicted boolean,
  ADD COLUMN IF NOT EXISTS fraud_scored_at timestamptz;
