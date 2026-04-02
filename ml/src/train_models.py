from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "ml" / "models"
REPORTS_DIR = ROOT / "ml" / "reports"


def build_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    numeric_cols = X.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_cols = [col for col in X.columns if col not in numeric_cols]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_cols),
            ("cat", categorical_pipeline, categorical_cols),
        ]
    )


def evaluate_task(
    task_name: str,
    df: pd.DataFrame,
    target_col: str,
    id_cols: list[str],
) -> dict:
    X = df.drop(columns=id_cols + [target_col], errors="ignore")
    y = df[target_col].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() > 1 else None,
    )

    preprocessor = build_preprocessor(X_train)
    X_train_p = preprocessor.fit_transform(X_train)
    X_test_p = preprocessor.transform(X_test)

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight="balanced",
            min_samples_leaf=2,
        ),
    }

    results = {}
    best_name = ""
    best_score = -1.0
    best_model = None

    for name, model in models.items():
        model.fit(X_train_p, y_train)
        preds = model.predict(X_test_p)
        probs = model.predict_proba(X_test_p)[:, 1]

        metrics = {
            "accuracy": float(accuracy_score(y_test, preds)),
            "precision": float(precision_score(y_test, preds, zero_division=0)),
            "recall": float(recall_score(y_test, preds, zero_division=0)),
            "f1": float(f1_score(y_test, preds, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, probs)),
        }
        if task_name == "fraud":
            metrics["pr_auc"] = float(average_precision_score(y_test, probs))

        results[name] = metrics

        comparison_score = metrics["f1"] if task_name == "fraud" else metrics["roc_auc"]
        if comparison_score > best_score:
            best_score = comparison_score
            best_name = name
            best_model = model

    assert best_model is not None

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, MODELS_DIR / f"{task_name}_model.joblib")
    joblib.dump(preprocessor, MODELS_DIR / f"{task_name}_preprocessor.joblib")

    if task_name == "fraud":
        probs = best_model.predict_proba(X_test_p)[:, 1]
        threshold = 0.5
        best_f1 = -1.0
        for t in np.round(np.arange(0.05, 0.96, 0.05), 2):
            preds = (probs >= t).astype(int)
            f1 = float(f1_score(y_test, preds, zero_division=0))
            if f1 > best_f1:
                best_f1 = f1
                threshold = float(t)
        env_thr = os.getenv("FRAUD_THRESHOLD_OVERRIDE", "").strip()
        if env_thr:
            threshold = float(env_thr)
        feature_columns = X.columns.tolist()
        cfg = {"threshold": threshold, "feature_columns": feature_columns, "best_model": best_name}
        (MODELS_DIR / "fraud_inference_config.json").write_text(json.dumps(cfg, indent=2))

    return {
        "task": task_name,
        "target": target_col,
        "rows": int(len(df)),
        "class_balance": float(df[target_col].mean()),
        "models": results,
        "best_model": best_name,
    }


def main() -> None:
    fraud_path = DATA_DIR / "fraud_dataset.csv"
    delivery_path = DATA_DIR / "delivery_dataset.csv"
    if not fraud_path.exists() or not delivery_path.exists():
        raise FileNotFoundError("Run extract_and_clean.py first to generate processed datasets.")

    fraud_df = pd.read_csv(fraud_path)
    delivery_df = pd.read_csv(delivery_path)

    fraud_report = evaluate_task(
        task_name="fraud",
        df=fraud_df,
        target_col="is_fraud",
        id_cols=["order_id", "customer_id"],
    )
    delivery_report = evaluate_task(
        task_name="delivery",
        df=delivery_df,
        target_col="late_delivery",
        id_cols=["shipment_id", "order_id"],
    )

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    summary = {"fraud": fraud_report, "delivery": delivery_report}
    (REPORTS_DIR / "metrics_summary.json").write_text(json.dumps(summary, indent=2))
    (MODELS_DIR / "model_metadata.json").write_text(json.dumps(summary, indent=2))

    print("Training complete. Saved models and metrics.")
    print(f"- {MODELS_DIR / 'fraud_model.joblib'}")
    print(f"- {MODELS_DIR / 'delivery_model.joblib'}")
    print(f"- {REPORTS_DIR / 'metrics_summary.json'}")


if __name__ == "__main__":
    main()
