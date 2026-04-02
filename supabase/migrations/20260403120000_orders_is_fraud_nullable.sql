-- NULL = admin has not set fraud label yet; true/false = labeled
alter table orders alter column is_fraud drop not null;
alter table orders alter column is_fraud drop default;

comment on column orders.is_fraud is 'NULL = pending admin review; true/fraud or false/legit once labeled';
