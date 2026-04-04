from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ml" / "models"
FRAUD_CONFIG = MODELS_DIR / "fraud_inference_config.json"
DELIVERY_CONFIG = MODELS_DIR / "delivery_inference_config.json"


def _coerce_float(value: object, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _enrich_fraud_payload(payload: dict) -> dict:
    """Fill derived columns expected by fraud_inference_config when omitted (forms, HTTP API)."""
    p = dict(payload)
    sub = _coerce_float(p.get("order_subtotal"))
    ship = _coerce_float(p.get("shipping_fee"))
    tax = _coerce_float(p.get("tax_amount"))
    if sub > 0 and math.isfinite(sub):
        p["shipping_to_subtotal_ratio"] = (ship / sub) if math.isfinite(ship) else 0.0
        p["tax_to_subtotal_ratio"] = (tax / sub) if math.isfinite(tax) else 0.0
    else:
        p["shipping_to_subtotal_ratio"] = 0.0
        p["tax_to_subtotal_ratio"] = 0.0
    if p.get("actual_days") in (None, ""):
        p["actual_days"] = _coerce_float(p.get("promised_days"), 0.0)
    return p


def _fraud_threshold() -> float:
    if FRAUD_CONFIG.exists():
        return float(json.loads(FRAUD_CONFIG.read_text())["threshold"])
    env = os.getenv("FRAUD_THRESHOLD", "").strip()
    return float(env) if env else 0.5


def _delivery_threshold() -> float:
    if DELIVERY_CONFIG.exists():
        return float(json.loads(DELIVERY_CONFIG.read_text()).get("threshold", 0.5))
    return 0.5


def _delivery_feature_frame(payload: dict) -> pd.DataFrame:
    if not DELIVERY_CONFIG.exists():
        return pd.DataFrame([payload])
    cols = json.loads(DELIVERY_CONFIG.read_text()).get("feature_columns")
    if not cols:
        return pd.DataFrame([payload])
    row = {c: payload.get(c) for c in cols}
    return pd.DataFrame([row])


def _fraud_feature_frame(payload: dict) -> pd.DataFrame:
    if not FRAUD_CONFIG.exists():
        return pd.DataFrame([payload])
    cols = json.loads(FRAUD_CONFIG.read_text()).get("feature_columns")
    if not cols:
        return pd.DataFrame([payload])
    row = {c: payload.get(c) for c in cols}
    return pd.DataFrame([row])


def predict(task: str, payload: dict) -> dict:
    payload = dict(payload)
    if task == "fraud":
        payload = _enrich_fraud_payload(payload)

    model_path = MODELS_DIR / f"{task}_model.joblib"
    prep_path = MODELS_DIR / f"{task}_preprocessor.joblib"
    if not model_path.exists() or not prep_path.exists():
        raise FileNotFoundError(f"Missing artifacts for task={task}. Run training first.")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)

    if task == "fraud":
        df = _fraud_feature_frame(payload)
        threshold = _fraud_threshold()
    elif task == "delivery":
        df = _delivery_feature_frame(payload)
        threshold = _delivery_threshold()
    else:
        df = pd.DataFrame([payload])
        threshold = 0.5

    X = preprocessor.transform(df)
    probability = float(model.predict_proba(X)[:, 1][0])
    prediction = int(probability >= threshold)

    try:
        from monitor import PredictionLogger

        PredictionLogger().log(
            task=task,
            order_id=int(payload.get("order_id", -1)),
            probability=probability,
            prediction=prediction,
            features=payload,
        )
    except Exception:
        pass

    return {"task": task, "prediction": prediction, "probability": probability}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", choices=["fraud", "delivery"], required=True)
    parser.add_argument("--json", required=True, help="JSON payload for one prediction row")
    args = parser.parse_args()

    payload = json.loads(args.json)
    result = predict(args.task, payload)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
