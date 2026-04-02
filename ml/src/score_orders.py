"""Batch-score fraud for all orders and write probabilities to Postgres (Supabase)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import joblib
import pandas as pd
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[2]
ML_SRC = Path(__file__).resolve().parent
if str(ML_SRC) not in sys.path:
    sys.path.insert(0, str(ML_SRC))

from extract_and_clean import get_engine, load_table  # noqa: E402
from fraud_features import build_fraud_dataset  # noqa: E402

MODELS_DIR = ROOT / "ml" / "models"


def load_fraud_threshold() -> float:
    cfg_path = MODELS_DIR / "fraud_inference_config.json"
    if cfg_path.exists():
        return float(json.loads(cfg_path.read_text())["threshold"])
    env = os.getenv("FRAUD_THRESHOLD", "").strip()
    return float(env) if env else 0.5


def main() -> None:
    model_path = MODELS_DIR / "fraud_model.joblib"
    prep_path = MODELS_DIR / "fraud_preprocessor.joblib"
    if not model_path.exists() or not prep_path.exists():
        raise FileNotFoundError("Train first: python ml/src/train_models.py (needs processed CSVs).")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)
    threshold = load_fraud_threshold()

    engine = get_engine()
    tables = ["customers", "orders", "order_items", "shipments"]
    dfs = {name: load_table(engine, name) for name in tables}

    fraud_df = build_fraud_dataset(dfs)
    id_cols = ["order_id", "customer_id"]
    target_col = "is_fraud"
    X = fraud_df.drop(columns=id_cols + [target_col], errors="ignore")
    order_ids = fraud_df["order_id"].astype(int)

    X_t = preprocessor.transform(X)
    probs = model.predict_proba(X_t)[:, 1]
    preds = (probs >= threshold).astype(bool)

    stmt = text(
        """
        UPDATE orders
        SET fraud_probability = :prob,
            fraud_predicted = :pred,
            fraud_scored_at = NOW()
        WHERE order_id = :oid
        """
    )

    n = 0
    with engine.begin() as conn:
        for oid, prob, pred in zip(order_ids, probs, preds, strict=True):
            conn.execute(stmt, {"prob": float(prob), "pred": bool(pred), "oid": int(oid)})
            n += 1

    print(f"Scored {n} orders (threshold={threshold}).")


if __name__ == "__main__":
    main()
