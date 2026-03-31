# Deployment Assignment Plan (Postgres + Vercel + Supabase)

This plan is split into two parallel tasks:
1) building the web app and deployment surface, and
2) building the ML pipeline notebook.

---

## Task 1: Create the Webapp (Vercel + Supabase)

### Goal
Build a minimal web app/API layer that reads and writes to Supabase Postgres and can trigger or serve model inference.

### Deliverables
- Deployed Vercel app connected to Supabase.
- Secure environment variable setup (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` as needed).
- API route(s) for:
  - health check (`/api/health`)
  - fetching candidate orders to score (`/api/orders/unscored`)
  - writing prediction outputs (`/api/predictions/upsert`)
- `order_predictions` table in Supabase and a simple UI/table page to view high-risk orders.

### Steps
1. Initialize web app project (Next.js recommended for Vercel).
2. Install Supabase client and configure env vars locally and in Vercel.
3. Create SQL migration scripts for:
   - core schema parity from `shop.db` (if needed),
   - `order_predictions` table,
   - helpful indexes (for `order_id`, `prediction_timestamp`).
4. Implement API routes and validate DB connectivity end to end.
5. Add basic frontend page for ranked predictions (descending by late-delivery probability).
6. Add scheduled trigger strategy:
   - Option A: Vercel Cron hitting an inference endpoint.
   - Option B: external scheduler/GitHub Actions hitting a secured webhook.
7. Deploy to Vercel and verify logs + DB writes.

### Definition of Done
- Vercel URL is live.
- Can manually hit endpoint(s) and see prediction rows written to Supabase.
- Dashboard/page displays latest scored orders sorted by risk.

---

## Task 2: Create the Jupyter Notebook (ML Pipeline)

### Goal
Implement the Chapter 17-style pipeline in `shop.ipynb` using Postgres data flow (Supabase), train a reproducible model, and produce artifacts for inference.

### Deliverables
- Completed `shop.ipynb` with clear sections:
  1. Data extraction from Postgres (Supabase)
  2. ETL/feature engineering
  3. Train/test split + model training
  4. Evaluation metrics
  5. Model serialization (`joblib`)
  6. Inference on new/unscored records
  7. Writeback preview to `order_predictions`
- Saved artifacts:
  - `artifacts/late_delivery_model.sav`
  - `artifacts/metrics.json`
  - `artifacts/model_metadata.json`

### Steps
1. Connect notebook to Supabase Postgres (SQLAlchemy or psycopg).
2. Build modeling dataset (one row per `order_id`) by joining:
   - `orders`, `customers`, `order_items`, `products`, `shipments`.
3. Define target:
   - `y = late_delivery` (from `shipments.late_delivery`).
4. Build preprocessing + model pipeline:
   - `ColumnTransformer` for numeric/categorical handling.
   - Baseline classifier (logistic regression), optional challenger model.
5. Evaluate and record metrics (accuracy, precision, recall, F1, ROC-AUC).
6. Serialize model + metadata with timestamp and feature list.
7. Run notebook inference section on operational-style records and prepare rows for DB upsert.

### Definition of Done
- Notebook runs top-to-bottom without manual patching.
- Model artifact is produced and reloadable.
- Inference output schema matches `order_predictions` writeback contract.

---

## Integration Checkpoint (Both Tasks Together)

- Contract alignment:
  - Notebook inference output columns exactly match web API write endpoint.
- Security alignment:
  - Service-role key never exposed in client-side code.
- Operational alignment:
  - One command/workflow exists to refresh model and one to score new orders.

## Suggested Order of Execution
1. Stand up Supabase schema + web app connection.
2. Build notebook pipeline and generate first model artifact.
3. Wire web API to consume artifact outputs and write predictions.
4. Add scheduling and final end-to-end demo.
