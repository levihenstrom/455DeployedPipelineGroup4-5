"""
Serialize fitted fraud preprocessor + logistic model to JSON for TypeScript inference
(Vercel-friendly: no Python, no onnxruntime native binaries).

Run from repo root:
  python ml/src/export_fraud_js_bundle.py

Writes web/ml-runtime/fraud_inference_bundle.json (tracked in git for deploy).
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ml" / "models"
OUT_PATH = ROOT / "web" / "ml-runtime" / "fraud_inference_bundle.json"


def _load_pipeline():
    prep = joblib.load(MODELS_DIR / "fraud_preprocessor.joblib")
    clf = joblib.load(MODELS_DIR / "fraud_model.joblib")
    cfg = json.loads((MODELS_DIR / "fraud_inference_config.json").read_text())
    return prep, clf, cfg


def _build_bundle(prep, clf, cfg: dict) -> dict:
    num_pipe = prep.named_transformers_["num"]
    cat_pipe = prep.named_transformers_["cat"]
    num_imputer = num_pipe.named_steps["imputer"]
    num_scaler = num_pipe.named_steps["scaler"]
    cat_imputer = cat_pipe.named_steps["imputer"]
    cat_ohe = cat_pipe.named_steps["onehot"]

    numeric_cols = list(prep.transformers_[0][2])
    categorical_cols = list(prep.transformers_[1][2])

    numeric = []
    for i, name in enumerate(numeric_cols):
        median = float(num_imputer.statistics_[i])
        mean = float(num_scaler.mean_[i])
        scale = float(num_scaler.scale_[i])
        if scale == 0.0 or not math.isfinite(scale):
            scale = 1.0
        numeric.append({"name": name, "median": median, "mean": mean, "scale": scale})

    categorical = []
    for i, name in enumerate(categorical_cols):
        fill = cat_imputer.statistics_[i]
        if fill is None or (isinstance(fill, float) and np.isnan(fill)):
            fill = ""
        else:
            fill = str(fill)
        cats = [str(c) for c in cat_ohe.categories_[i].tolist()]
        categorical.append({"name": name, "fill": fill, "categories": cats})

    coef = [float(x) for x in np.asarray(clf.coef_).ravel()]
    intercept = float(np.asarray(clf.intercept_).ravel()[0])

    return {
        "version": 1,
        "threshold": float(cfg["threshold"]),
        "feature_columns": list(cfg["feature_columns"]),
        "numeric": numeric,
        "categorical": categorical,
        "coef": coef,
        "intercept": intercept,
    }


def _sigmoid(z: float) -> float:
    if z >= 0:
        ez = math.exp(-z)
        return 1.0 / (1.0 + ez)
    ez = math.exp(z)
    return ez / (1.0 + ez)


def _dense_from_raw(bundle: dict, row: dict) -> np.ndarray:
    num_vals = []
    for spec in bundle["numeric"]:
        name = spec["name"]
        raw = row.get(name)
        if raw is None or raw == "":
            v = spec["median"]
        else:
            try:
                v = float(raw)
            except (TypeError, ValueError):
                v = spec["median"]
        if not math.isfinite(v):
            v = spec["median"]
        scaled = (v - spec["mean"]) / spec["scale"]
        num_vals.append(scaled)

    cat_vals = []
    for spec in bundle["categorical"]:
        name = spec["name"]
        raw = row.get(name)
        if raw is None or raw == "":
            s = spec["fill"]
        else:
            s = str(raw)
        cats = spec["categories"]
        width = len(cats)
        if s not in cats:
            cat_vals.extend([0.0] * width)
        else:
            idx = cats.index(s)
            cat_vals.extend([1.0 if j == idx else 0.0 for j in range(width)])

    return np.asarray(num_vals + cat_vals, dtype=np.float64)


def _verify(prep, clf, bundle: dict, n: int = 500) -> float:
    csv = ROOT / "data" / "processed" / "fraud_dataset.csv"
    if not csv.exists():
        return 0.0
    df = pd.read_csv(csv, nrows=n)
    cols = bundle["feature_columns"]
    X = df[cols]
    ref = prep.transform(X)
    ref_p = clf.predict_proba(ref)[:, 1]
    max_err = 0.0
    for i in range(len(df)):
        row = X.iloc[i].to_dict()
        x = _dense_from_raw(bundle, row)
        z = float(np.dot(bundle["coef"], x) + bundle["intercept"])
        p = float(_sigmoid(z))
        max_err = max(max_err, abs(p - ref_p[i]))
        if not np.allclose(x, ref[i], rtol=1e-4, atol=1e-4):
            raise RuntimeError(f"Dense mismatch at row {i}")
    return max_err


def main() -> None:
    prep, clf, cfg = _load_pipeline()
    bundle = _build_bundle(prep, clf, cfg)
    err = _verify(prep, clf, bundle)
    print(f"Max |p_js - p_sklearn| on sample: {err:.6f}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(bundle, indent=2))
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
