"""
Back-compat entry: batch late-delivery scores → order_predictions (SQLite or Postgres).

Prefer: python ml/src/score_late_delivery_predictions.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    script = ROOT / "ml" / "src" / "score_late_delivery_predictions.py"
    r = subprocess.run([sys.executable, str(script)], cwd=str(ROOT))
    if r.returncode != 0:
        sys.exit(r.returncode)
    print("Predictions written: see score_late_delivery_predictions output above.")


if __name__ == "__main__":
    main()
