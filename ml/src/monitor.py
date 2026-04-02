import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MONITORING_DIR = ROOT / "ml" / "monitoring"
PREDICTIONS_LOG = MONITORING_DIR / "predictions.jsonl"
ACCURACY_LOG = MONITORING_DIR / "accuracy_log.jsonl"
RETRAIN_TRIGGER = MONITORING_DIR / "retrain_trigger.json"

class PredictionLogger:
    def __init__(self):
        MONITORING_DIR.mkdir(parents=True, exist_ok=True)
        
    def log(self, task: str, order_id: int, probability: float, prediction: int, features: dict):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "task": task,
            "order_id": order_id,
            "probability": probability,
            "prediction": prediction,
            "features": features
        }
        with open(PREDICTIONS_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")

def check_drift(task: str):
    if not ACCURACY_LOG.exists():
        return False
        
    entries = []
    with open(ACCURACY_LOG, "r") as f:
        for line in f:
            if not line.strip(): continue
            parsed = json.loads(line)
            if parsed.get("task") == task:
                entries.append(parsed)
                
    last_50 = entries[-50:]
    if not last_50: return False
    
    thresholds = {"fraud": ("recall", 0.70), "delivery": ("accuracy", 0.80)}
    metric_name, threshold = thresholds.get(task, ("accuracy", 0.0))
    
    valid_metrics = [e.get(metric_name) for e in last_50 if e.get(metric_name) is not None]
    if not valid_metrics: return False
    
    rolling_metric = sum(valid_metrics) / len(valid_metrics)
    
    triggered = rolling_metric < threshold
    if triggered:
        trigger_data = {
            "task": task,
            "metric": metric_name,
            "value": rolling_metric,
            "threshold": threshold,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        with open(RETRAIN_TRIGGER, "w") as f:
            json.dump(trigger_data, f)
            
    return triggered

def score_against_ground_truth(task: str, ground_truth: dict):
    if not PREDICTIONS_LOG.exists():
        return
        
    predictions_by_order = {}
    with open(PREDICTIONS_LOG, "r") as f:
        for line in f:
            if not line.strip(): continue
            parsed = json.loads(line)
            if parsed.get("task") == task:
                predictions_by_order[parsed["order_id"]] = parsed["prediction"]
                
    y_true = []
    y_pred = []
    for order_id, label in ground_truth.items():
        if order_id in predictions_by_order:
            y_true.append(label)
            y_pred.append(predictions_by_order[order_id])
            
    if not y_true: return
    
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    metrics = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "task": task,
        "samples": len(y_true),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0))
    }
    with open(ACCURACY_LOG, "a") as f:
        f.write(json.dumps(metrics) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-drift", action="store_true")
    parser.add_argument("--score-task", choices=["fraud", "delivery"])
    parser.add_argument("--summary", choices=["fraud", "delivery"])
    args = parser.parse_args()
    
    if args.check_drift:
        check_drift("fraud")
        check_drift("delivery")
    elif args.score_task:
        pass
    elif args.summary:
        pass
