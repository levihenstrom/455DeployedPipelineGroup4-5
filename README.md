# Class Demo Website + ML (Supabase + Vercel)

This project is a class demonstration that turns the existing SQLite database (`shop.db`) into:

- a simple web dashboard and prediction app (Next.js + TypeScript)
- a small ML pipeline (data cleaning + baseline algorithms)
- a deployment-ready structure for Supabase (database) and Vercel (frontend)

The focus is clarity and reproducibility, not advanced production engineering.

## Project Goals

- Build a minimal website for business insights and two prediction demos.
- Show a clean ML workflow: extraction -> cleaning -> feature engineering -> training -> evaluation.
- Prepare SQL and setup notes for Supabase and deployment notes for Vercel.

## Dataset Summary

Source DB: `shop.db`

Main tables:
- `customers`
- `products`
- `orders`
- `order_items`
- `shipments`
- `product_reviews`

Targets:
- Fraud classification: `orders.is_fraud` (imbalanced)
- Late-delivery classification: `shipments.late_delivery`

## Repository Structure

- `web/` Next.js app (dashboard + prediction pages + API routes)
- `ml/` Python scripts for extraction, cleaning, training, and local inference
- `data/raw/` exported CSV snapshots from SQLite
- `data/processed/` model-ready datasets
- `ml/models/` saved model artifacts and preprocessing pipelines
- `ml/reports/` metrics and model summary outputs
- `sql/` Supabase schema, views, and loading notes

## ML Pipeline

### 1) Extract + Clean
Script: `ml/src/extract_and_clean.py`

What it does:
- Reads all core tables from `shop.db`
- Exports snapshots to `data/raw/`
- Cleans nulls, normalizes booleans/dates, and creates stable model features
- Produces:
  - `data/processed/fraud_dataset.csv`
  - `data/processed/delivery_dataset.csv`

### 2) Train + Evaluate
Script: `ml/src/train_models.py`

For each task:
- Baseline: Logistic Regression
- Non-linear model: Random Forest
- Evaluation:
  - Fraud: precision, recall, F1, PR-AUC, ROC-AUC
  - Delivery: accuracy, precision, recall, F1, ROC-AUC

Outputs:
- `ml/models/fraud_model.joblib`
- `ml/models/delivery_model.joblib`
- `ml/models/fraud_preprocessor.joblib`
- `ml/models/delivery_preprocessor.joblib`
- `ml/models/model_metadata.json`
- `ml/reports/metrics_summary.json`

### 3) Local Prediction Helper
Script: `ml/src/predict.py`

Provides simple local CLI prediction for either fraud or delivery examples.

## Web App (Next.js)

The web app includes:
- dashboard page with quick KPIs
- fraud prediction form
- late-delivery prediction form
- model insights from generated metrics

Prediction API routes:
- `web/src/app/api/predict/fraud/route.ts`
- `web/src/app/api/predict/delivery/route.ts`

These routes call Python inference scripts (class demo approach).

## Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQLite CLI (optional but recommended)

### 1) Run ML pipeline

From project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
python ml/src/extract_and_clean.py
python ml/src/train_models.py
```

### 2) Run web app

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

### 3) Quick ML sanity check (no web)

```bash
source .venv/bin/activate
python ml/src/predict.py --task fraud --json '{"order_total":120.5,"order_subtotal":110.0,"shipping_fee":5.0,"tax_amount":5.5,"risk_score":60.0,"payment_method":"card","device_type":"mobile","ip_country":"US","promo_used":0,"customer_segment":"standard","loyalty_tier":"silver","gender":"Female","state":"CA","shipping_state":"CA","shipping_method":"standard","distance_band":"regional","promised_days":3,"actual_days":3,"items_per_order":2,"unique_products":2,"avg_item_price":55.0,"customer_age":31,"account_age_days":250,"shipping_to_subtotal_ratio":0.0455,"tax_to_subtotal_ratio":0.05}'
python ml/src/predict.py --task delivery --json '{"carrier":"UPS","shipping_method":"standard","distance_band":"regional","promised_days":3,"actual_days":4,"actual_minus_promised":1,"hours_to_ship":16,"shipping_state":"CA","state":"CA","order_total":120.5,"order_subtotal":110.0,"shipping_fee":5.0,"tax_amount":5.5,"shipping_to_subtotal_ratio":0.0455,"payment_method":"card","device_type":"mobile","ip_country":"US","promo_used":0,"customer_segment":"standard","loyalty_tier":"silver","total_items":2,"unique_products":2}'
```

## Supabase Setup Notes

1. Create a new Supabase project.
2. Run SQL in order:
   - `sql/schema.sql`
   - `sql/views.sql`
3. Exported CSVs already exist at `data/raw/*.csv`. Import them into Supabase tables:
   - `customers` `products` `orders` `order_items` `shipments` `product_reviews`
4. For class demo, you can keep it simple:
   - Disable RLS (or add a permissive `SELECT` policy for the `anon` role) so the frontend can read the KPI views.
   - The web dashboard reads from `vw_kpi_overview`.

More detailed steps: `sql/load_data_in_supabase.md`

## Vercel Deployment Notes

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set project root to `web/`.
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PYTHON_BIN` (optional, default `python3`)
5. Deploy and test dashboard + prediction pages.
6. Sanity checks after deploy:
   - Visit `/` and confirm KPI cards load
   - Open `/fraud` and `/delivery` and submit the sample inputs

## Demo Script (Class Presentation)

1. Show database-driven dashboard KPIs.
2. Briefly show cleaning outputs in `data/processed/`.
3. Show fraud prediction with one sample input.
4. Show late-delivery prediction with one sample input.
5. Explain metrics and why baseline + RF were chosen.

### Optional: local API verification (for live demos)

From a second terminal:

```bash
cd web
PYTHON_BIN="/Users/jooyoung/Downloads/455_class_project/.venv/bin/python" npm run dev -- --port 3005
```

Then run:

```bash
curl -s -X POST "http://localhost:3005/api/predict/fraud" -H "Content-Type: application/json" --data '{"order_total":120.5,"order_subtotal":110.0,"shipping_fee":5.0,"tax_amount":5.5,"risk_score":60.0,"payment_method":"card","device_type":"mobile","ip_country":"US","promo_used":0,"customer_segment":"standard","loyalty_tier":"silver","gender":"Female","state":"CA","shipping_state":"CA","shipping_method":"standard","distance_band":"regional","promised_days":3,"actual_days":3,"items_per_order":2,"unique_products":2,"avg_item_price":55.0,"customer_age":31,"account_age_days":250,"shipping_to_subtotal_ratio":0.0455,"tax_to_subtotal_ratio":0.05}'

curl -s -X POST "http://localhost:3005/api/predict/delivery" -H "Content-Type: application/json" --data '{"carrier":"UPS","shipping_method":"standard","distance_band":"regional","promised_days":3,"actual_days":4,"actual_minus_promised":1,"hours_to_ship":16,"shipping_state":"CA","state":"CA","order_total":120.5,"order_subtotal":110.0,"shipping_fee":5.0,"tax_amount":5.5,"shipping_to_subtotal_ratio":0.0455,"payment_method":"card","device_type":"mobile","ip_country":"US","promo_used":0,"customer_segment":"standard","loyalty_tier":"silver","total_items":2,"unique_products":2}'
```

## Limitations

- API prediction via Python subprocess is demo-oriented.
- No advanced feature store or model serving infrastructure.
- Fraud class imbalance is handled with basic weighting only.
- UI is intentionally simple for class timeline.

## Next Improvements

- Replace subprocess inference with a dedicated model service.
- Add cross-validation and threshold tuning.
- Add simple auth and role-based views if needed.
- Add charts for trends and segment-level drilldowns.
