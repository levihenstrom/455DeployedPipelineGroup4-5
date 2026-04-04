-- Late-delivery batch scores for warehouse priority queue (ml/src/score_late_delivery_predictions.py)
create table if not exists public.order_predictions (
  order_id bigint primary key references public.orders (order_id) on delete cascade,
  late_delivery_probability double precision not null,
  predicted_late_delivery integer not null,
  prediction_timestamp timestamptz not null default now()
);

create index if not exists idx_order_predictions_late_prob
  on public.order_predictions (late_delivery_probability desc);
