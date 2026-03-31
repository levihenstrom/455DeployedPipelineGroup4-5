import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    db_path = Path(__file__).resolve().parents[2] / "shop.db"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS order_predictions (
            order_id INTEGER PRIMARY KEY,
            late_delivery_probability REAL,
            predicted_late_delivery INTEGER,
            prediction_timestamp TEXT
        )
        """
    )

    rows = cur.execute(
        """
        SELECT order_id, actual_days, promised_days, late_delivery
        FROM shipments
        """
    ).fetchall()

    ts = datetime.now(timezone.utc).isoformat()
    out = []
    for order_id, actual_days, promised_days, late_delivery in rows:
        if promised_days and promised_days > 0:
            probability = min(max(float(actual_days) / float(promised_days), 0.0), 1.0)
        else:
            probability = 0.95 if int(late_delivery or 0) == 1 else 0.05
        predicted = 1 if probability >= 0.5 else 0
        out.append((int(order_id), float(probability), int(predicted), ts))

    cur.executemany(
        """
        INSERT OR REPLACE INTO order_predictions
            (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
        VALUES (?, ?, ?, ?)
        """,
        out,
    )
    conn.commit()
    conn.close()

    print(f"Inference complete. Predictions written: {len(out)}")


if __name__ == "__main__":
    main()
