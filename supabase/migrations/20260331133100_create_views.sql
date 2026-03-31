-- Read-oriented views for dashboard pages

create or replace view vw_kpi_overview as
select
  (select count(*) from orders) as total_orders,
  (select count(*) from customers) as total_customers,
  round((select avg(case when is_fraud then 1 else 0 end)::numeric * 100 from orders), 2) as fraud_rate_pct,
  round((select avg(case when late_delivery then 1 else 0 end)::numeric * 100 from shipments), 2) as late_delivery_rate_pct,
  round((select sum(order_total)::numeric from orders), 2) as gross_revenue;

create or replace view vw_fraud_by_payment as
select
  payment_method,
  count(*) as orders_count,
  round(avg(case when is_fraud then 1 else 0 end)::numeric * 100, 2) as fraud_rate_pct
from orders
group by payment_method
order by fraud_rate_pct desc;

create or replace view vw_delivery_by_carrier as
select
  carrier,
  count(*) as shipments_count,
  round(avg(case when late_delivery then 1 else 0 end)::numeric * 100, 2) as late_rate_pct
from shipments
group by carrier
order by late_rate_pct desc;
