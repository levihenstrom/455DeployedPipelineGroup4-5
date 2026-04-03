import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

import extract_and_clean
from train_models import build_preprocessor

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "ml" / "models"
BACKUPS_DIR = MODELS_DIR / "backups"
REPORTS_DIR = ROOT / "ml" / "reports"
LOG_FILE = REPORTS_DIR / "retrain_log.jsonl"
METADATA_FILE = MODELS_DIR / "model_metadata.json"

def evaluate_and_promote(task_name: str, df: pd.DataFrame, target_col: str, id_cols: list) -> dict:
    X = df.drop(columns=id_cols + [target_col], errors="ignore")
    y = df[target_col].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
    )

    preprocessor = build_preprocessor(X_train)
    X_train_p = preprocessor.fit_transform(X_train)
    X_test_p = preprocessor.transform(X_test)

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "random_forest": RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced", min_samples_leaf=2)
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

        comparison_score = metrics["pr_auc"] if task_name == "fraud" else metrics["roc_auc"]
        if comparison_score > best_score:
            best_score = comparison_score
            best_name = name
            best_model = model

    report = {
        "task": task_name,
        "target": target_col,
        "rows": int(len(df)),
        "class_balance": float(df[target_col].mean()),
        "models": results,
        "best_model": best_name,
    }
    
    old_metadata = {}
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            old_metadata = json.load(f)
            
    old_task_metadata = old_metadata.get(task_name, {})
    old_rows = old_task_metadata.get("rows", 0)
    old_balance = old_task_metadata.get("class_balance", 0)
    print(f"[{task_name}] Old rows: {old_rows}, class_balance: {old_balance:.3f}")
    print(f"[{task_name}] New rows: {report['rows']}, class_balance: {report['class_balance']:.3f}")
    
    promote = True
    if old_task_metadata and "models" in old_task_metadata:
        old_best = old_task_metadata["best_model"]
        old_metrics = old_task_metadata["models"][old_best]
        old_score = old_metrics.get("pr_auc") if task_name == "fraud" else old_metrics.get("roc_auc")
        if old_score is not None:
            print(f"[{task_name}] Old score ({'pr_auc' if task_name == 'fraud' else 'roc_auc'}): {old_score:.3f}")
            print(f"[{task_name}] New score: {best_score:.3f}")
            if best_score <= old_score:
                print(f"[{task_name}] New model did not improve. Not overwriting.")
                promote = False
    
    if promote:
        print(f"[{task_name}] Promoting new model {best_name}")
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        for suffix in ["_model.joblib", "_preprocessor.joblib"]:
            orig = MODELS_DIR / f"{task_name}{suffix}"
            if orig.exists():
                shutil.copy2(str(orig), str(BACKUPS_DIR / f"{task_name}_{ts}{suffix}"))
                
        # we copy instead of move just to be safe, then overwrite with dump
        joblib.dump(best_model, MODELS_DIR / f"{task_name}_model.joblib")
        joblib.dump(preprocessor, MODELS_DIR / f"{task_name}_preprocessor.joblib")
    
    return report, promote
    
def main():
    try:
        if extract_and_clean.DATABASE_URL:
            extract_and_clean.main()
        else:
            print("DATABASE_URL not set, using existing CSVs")
    except Exception as e:
        print(f"Failed to extract new data, using existing: {e}")
        
    fraud_path = DATA_DIR / "fraud_dataset.csv"
    delivery_path = DATA_DIR / "delivery_dataset.csv"
    if not fraud_path.exists() or not delivery_path.exists():
        raise FileNotFoundError("Processed datasets missing.")
        
    fraud_df = pd.read_csv(fraud_path)
    delivery_df = pd.read_csv(delivery_path)
    
    fraud_report, fraud_promoted = evaluate_and_promote(
        "fraud", fraud_df, "is_fraud", ["order_id", "customer_id"]
    )
    delivery_report, delivery_promoted = evaluate_and_promote(
        "delivery", delivery_df, "late_delivery", ["shipment_id", "order_id"]
    )
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    summary = {}
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            summary = json.load(f)
            
    summary["fraud"] = fraud_report if fraud_promoted else summary.get("fraud", fraud_report)
    summary["delivery"] = delivery_report if delivery_promoted else summary.get("delivery", delivery_report)
    
    (REPORTS_DIR / "metrics_summary.json").write_text(json.dumps(summary, indent=2))
    (MODELS_DIR / "model_metadata.json").write_text(json.dumps(summary, indent=2))
    
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "fraud": {"promoted": fraud_promoted, "report": fraud_report},
        "delivery": {"promoted": delivery_promoted, "report": delivery_report}
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
        
    print("Retrain pipeline finished.")

if __name__ == "__main__":
    main()
