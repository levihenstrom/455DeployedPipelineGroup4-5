from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ml" / "models"


def predict(task: str, payload: dict) -> dict:
    model_path = MODELS_DIR / f"{task}_model.joblib"
    prep_path = MODELS_DIR / f"{task}_preprocessor.joblib"
    if not model_path.exists() or not prep_path.exists():
        raise FileNotFoundError(f"Missing artifacts for task={task}. Run training first.")

    model = joblib.load(model_path)
    preprocessor = joblib.load(prep_path)

    df = pd.DataFrame([payload])
    X = preprocessor.transform(df)
    probability = float(model.predict_proba(X)[:, 1][0])
    prediction = int(probability >= 0.5)

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
