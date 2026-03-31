# Load Data Into Supabase

Use this order:

1. Run `schema.sql`
2. Import CSV files from `data/raw/` into matching tables
3. Run `views.sql`

## Import Tips

- In Supabase Table Editor, use **Import data from CSV**.
- Keep source IDs (`customer_id`, `order_id`, etc.) as provided.
- Ensure booleans are converted:
  - `0` -> `false`
  - `1` -> `true`
- Validate row counts after import.

## RLS / Permissions Note (for demo)

If Supabase RLS is enabled on your tables/views, your Next.js frontend may not be able to read KPIs.

For a simple class demo you can either:

- Disable RLS for the demo tables (`customers`, `products`, `orders`, `order_items`, `shipments`, `product_reviews`), or
- Add a permissive `SELECT` policy for the `anon` role on those tables (views generally inherit underlying privileges).

## Suggested Validation Queries

```sql
select count(*) from customers;
select count(*) from orders;
select count(*) from shipments;
select * from vw_kpi_overview;
```
