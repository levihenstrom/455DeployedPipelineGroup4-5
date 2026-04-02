-- Model output for fraud (0–1); admin ground truth remains is_fraud
alter table orders add column if not exists fraud_probability double precision;

comment on column orders.fraud_probability is 'Fraud model probability from predict.py; is_fraud is admin label';
