"""Batch-score late delivery (no outcome leakage) → order_predictions / SQLite."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[2]
ML_SRC = Path(__file__).resolve().parent
if str(ML_SRC) not in sys.path:
    sys.path.insert(0, str(ML_SRC))

from extract_and_clean import build_delivery_dataset, get_engine, load_table  # noqa: E402

MODELS_DIR = ROOT / "ml" / "models"


def _delivery_threshold() -> float:
    cfg_path = MODELS_DIR / "delivery_inference_config.json"
    if cfg_path.exists():
        return float(json.loads(cfg_path.read_text()).get("threshold", 0.5))
    return 0.5


def main() -> None:
    model_path = MODELS_DIR / "delivery_model.joblib"
    prep_path = MODELS_DIR / "delivery_preprocessor.joblib"
    if not model_path.exists() or not prep_path.exists():
        raise FileNotFoundError("Train first: python ml/src/train_models.py (needs processed CSVs).")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)
    threshold = _delivery_threshold()

    engine = get_engine()
    tables = ["customers", "orders", "order_items", "shipments"]
    dfs = {name: load_table(engine, name) for name in tables}

    delivery_df = build_delivery_dataset(dfs)
    id_cols = ["shipment_id", "order_id"]
    target_col = "late_delivery"
    X = delivery_df.drop(columns=id_cols + [target_col], errors="ignore")
    order_ids = delivery_df["order_id"].astype(int)

    X_t = preprocessor.transform(X)
    probs = model.predict_proba(X_t)[:, 1]
    preds = (probs >= threshold).astype(int)

    ts = datetime.now(timezone.utc).isoformat()
    dialect = engine.dialect.name

    n = 0
    with engine.begin() as conn:
        if dialect == "sqlite":
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS order_predictions (
                        order_id INTEGER PRIMARY KEY,
                        late_delivery_probability REAL,
                        predicted_late_delivery INTEGER,
                        prediction_timestamp TEXT
                    )
                    """
                )
            )
            stmt = text(
                """
                INSERT OR REPLACE INTO order_predictions
                    (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
                VALUES (:oid, :prob, :pred, :ts)
                """
            )
            for oid, prob, pred in zip(order_ids, probs, preds, strict=True):
                conn.execute(
                    stmt,
                    {"oid": int(oid), "prob": float(prob), "pred": int(pred), "ts": ts},
                )
                n += 1
        else:
            # Supabase / Postgres often ship without this table; warehouse UI expects these columns.
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS order_predictions (
                        order_id BIGINT PRIMARY KEY REFERENCES orders (order_id) ON DELETE CASCADE,
                        late_delivery_probability DOUBLE PRECISION NOT NULL,
                        predicted_late_delivery INTEGER NOT NULL,
                        prediction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            del_stmt = text("DELETE FROM order_predictions WHERE order_id = :oid")
            ins_stmt = text(
                """
                INSERT INTO order_predictions
                    (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
                VALUES (:oid, :prob, :pred, NOW())
                """
            )
            for oid, prob, pred in zip(order_ids, probs, preds, strict=True):
                oid_i = int(oid)
                conn.execute(del_stmt, {"oid": oid_i})
                conn.execute(
                    ins_stmt,
                    {"oid": oid_i, "prob": float(prob), "pred": int(pred)},
                )
                n += 1

    print(f"Scored {n} orders for late delivery (threshold={threshold}, dialect={dialect}).")
    print(f"Predictions written: {n}")


if __name__ == "__main__":
    main()
