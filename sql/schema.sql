-- Core schema for Supabase/Postgres

create table if not exists customers (
  customer_id bigint primary key,
  full_name text not null,
  email text not null unique,
  gender text not null,
  birthdate date not null,
  created_at timestamptz not null,
  city text,
  state text,
  zip_code text,
  customer_segment text,
  loyalty_tier text,
  is_active boolean not null default true
);

create table if not exists products (
  product_id bigint primary key,
  sku text not null unique,
  product_name text not null,
  category text not null,
  price numeric not null,
  cost numeric not null,
  is_active boolean not null default true
);

create table if not exists orders (
  order_id bigint primary key,
  customer_id bigint not null references customers(customer_id),
  order_datetime timestamptz not null,
  billing_zip text,
  shipping_zip text,
  shipping_state text,
  payment_method text not null,
  device_type text not null,
  ip_country text not null,
  promo_used boolean not null default false,
  promo_code text,
  order_subtotal numeric not null,
  shipping_fee numeric not null,
  tax_amount numeric not null,
  order_total numeric not null,
  risk_score numeric not null,
  is_fraud boolean not null default false,
  fraud_probability numeric,
  fraud_predicted boolean,
  fraud_scored_at timestamptz
);

create table if not exists order_items (
  order_item_id bigint primary key,
  order_id bigint not null references orders(order_id),
  product_id bigint not null references products(product_id),
  quantity int not null,
  unit_price numeric not null,
  line_total numeric not null
);

create table if not exists shipments (
  shipment_id bigint primary key,
  order_id bigint not null unique references orders(order_id),
  ship_datetime timestamptz not null,
  carrier text not null,
  shipping_method text not null,
  distance_band text not null,
  promised_days int not null,
  actual_days int not null,
  late_delivery boolean not null default false
);

create table if not exists product_reviews (
  review_id bigint primary key,
  customer_id bigint not null references customers(customer_id),
  product_id bigint not null references products(product_id),
  rating int not null check (rating between 1 and 5),
  review_datetime timestamptz not null,
  review_text text,
  unique (customer_id, product_id)
);

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_datetime on orders(order_datetime);
create index if not exists idx_items_order on order_items(order_id);
create index if not exists idx_items_product on order_items(product_id);
create index if not exists idx_shipments_late on shipments(late_delivery);
create index if not exists idx_reviews_product on product_reviews(product_id);
create index if not exists idx_reviews_customer on product_reviews(customer_id);
