# Admin vs Customer + Supabase + Order completeness

## Phasing (per team decision)

- **Phase 1 (now):** Ship the web app UX and data behavior: modern sidebar, Customer vs Admin switch (no auth), complete order rows in **Supabase**, fraud prediction on new orders, admin `is_fraud` as ground truth, optional `fraud_probability` column. **Do not block** on nightly retrain infrastructure.
- **Phase 2 (later):** Midnight retrain job that writes a new `.joblib`/`.sav` and how/where that artifact is stored (Vercel limitations apply—deferred until you choose GitHub Actions vs Storage vs manual).

---

## Phase 1 — Web app and database behavior

### Supabase as primary (`shop.db` secondary or dev-only)

- Treat **Supabase** as the source of truth for deployed QA and demos: ensure `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` (or equivalent) are set so [`getSupabaseServerClient()`](web/src/lib/supabase.ts) is used instead of the SQLite fallback.
- **SQLite** (`shop.db`) path in API routes remains useful for offline dev; document that “production-like” flows should use Supabase env. Optionally add a short note in README: without Supabase env, local falls back to SQLite.

### Filling `orders` (and related) columns for new customer orders

Today [`POST /api/customers/[id]/orders`](web/src/app/api/customers/[id]/orders/route.ts) only sends `shipping_state`, `payment_method`, `shipping_method`, and line items; many `orders` columns are missing or hardcoded (`device_type: "web"`, `ip_country: "US"`, no billing/shipping zip, no promo, `risk_score: 0`).

**Recommended hybrid (good UX + training alignment):**

1. **Collect on the place-order / checkout UI** (expand [`web/src/app/place-order/page.tsx`](web/src/app/place-order/page.tsx)):
   - **Required:** keep state + payment method + cart; add **billing zip**, **shipping zip** (or “same as profile” using customer’s `zip_code` from Supabase when loaded).
   - **Optional:** promo code / “use promo” toggle, device type (default `web`), country if you want non-US demos.
2. **Derive server-side** (always):
   - Monetary fields already computed: `order_subtotal`, `shipping_fee`, `tax_amount`, `order_total`.
   - **`risk_score`:** keep as a *feature* for the model—either leave as a deterministic function of order totals until prediction runs, or set after first fraud `predict` from a separate internal score; **do not** confuse with `fraud_probability` (see below).
3. **Insert a matching `shipments` row** for each new order (schema in [`sql/schema.sql`](sql/schema.sql)) with defaults derived from `shipping_method` (e.g. `promised_days` / `actual_days` / `distance_band` / `carrier`) so feature building matches [`build_fraud_dataset`](ml/src/extract_and_clean.py) (orders + customers + **shipments** + order_item aggs).

If the form stays minimal, **documented server defaults** fill the rest (e.g. `billing_zip` = customer zip, `shipping_zip` = user shipping zip or same, `promo_used` false, `ip_country` US). The important part is **no nulls** where `NOT NULL` applies and consistency with fraud feature construction.

### Persist model output separately from `risk_score`

- Add **`fraud_probability`** (nullable `real`) on `orders` via [`sql/schema.sql`](sql/schema.sql) + **Supabase migration** under [`supabase/migrations/`](supabase/migrations/) (requires leaving `web/`-only constraint for this file).
- After insert + shipment + items: build fraud payload (mirror training features), call [`runPrediction("fraud", ...)`](web/src/lib/inference.ts), store probability in `fraud_probability`. **Admin label** remains **`is_fraud`**.

### Admin vs Customer shell (unchanged intent)

- Cookie `app_mode=customer|admin`, sidebar layout, Customer routes vs Admin routes.
- Admin: all orders newest-first, toggles for `is_fraud`, columns for model prob vs admin label.
- Pipeline tab: static diagram; retrain section can say “Phase 2: scheduled retrain.”

---

## Phase 2 — Nightly midnight retrain + new model file (deferred)

**Constraint:** Vercel serverless is **not** a durable place to “save a new `.sav` on disk” every night; artifacts must live in **git**, **object storage**, or a **runner** (e.g. GitHub Actions, VM).

**Intended story (when you implement):**

1. Export labeled orders from **Supabase** (admin `is_fraud` is the label).
2. Run [`ml/src/extract_and_clean.py`](ml/src/extract_and_clean.py) + [`ml/src/train_models.py`](ml/src/train_models.py) (output is `ml/models/fraud_model.joblib` today—`.sav` is equivalent if you prefer `joblib.dump` to `.sav`).
3. Publish artifact (commit, Storage, or CI artifact) and point inference at the new file.

**Schedule:** cron `0 0 * * *` in **UTC** unless you specify another timezone—document when you add Phase 2.

---

## Implementation todos (Phase 1)

| ID | Task |
|----|------|
| shell-mode | Sidebar + `app_mode` cookie + Customer vs Admin nav |
| order-fields | Extend checkout form + POST body; server fills defaults; insert full `orders` + `shipments` + `order_items` |
| supabase-env | Verify production/local use Supabase path; document SQLite fallback |
| fraud-payload | `buildFraudPayload` + post-insert `runPrediction`; write `fraud_probability` |
| admin-api-ui | GET all orders, PATCH `is_fraud`; admin table |
| db-migration | `fraud_probability` column + migration |
| pipeline-tab | Static ML flow; Phase 2 placeholder for retrain |
| qa-build | `npm run build` + Supabase smoke test |

## Implementation todos (Phase 2 — later)

| ID | Task |
|----|------|
| retrain-runner | Choose runner (e.g. GHA), export data, train, artifact strategy |
| cron | Midnight schedule + secrets |
| inference-source | Load latest model from chosen artifact location |
