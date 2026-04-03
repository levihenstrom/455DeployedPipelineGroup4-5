from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ml" / "models"
FRAUD_CONFIG = MODELS_DIR / "fraud_inference_config.json"


def _fraud_threshold() -> float:
    if FRAUD_CONFIG.exists():
        return float(json.loads(FRAUD_CONFIG.read_text())["threshold"])
    env = os.getenv("FRAUD_THRESHOLD", "").strip()
    return float(env) if env else 0.5


def _fraud_feature_frame(payload: dict) -> pd.DataFrame:
    if not FRAUD_CONFIG.exists():
        return pd.DataFrame([payload])
    cols = json.loads(FRAUD_CONFIG.read_text()).get("feature_columns")
    if not cols:
        return pd.DataFrame([payload])
    row = {c: payload.get(c) for c in cols}
    return pd.DataFrame([row])


def predict(task: str, payload: dict) -> dict:
    model_path = MODELS_DIR / f"{task}_model.joblib"
    prep_path = MODELS_DIR / f"{task}_preprocessor.joblib"
    if not model_path.exists() or not prep_path.exists():
        raise FileNotFoundError(f"Missing artifacts for task={task}. Run training first.")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)

    if task == "fraud":
        df = _fraud_feature_frame(payload)
        threshold = _fraud_threshold()
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
