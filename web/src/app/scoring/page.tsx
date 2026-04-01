"use client";

import { useState } from "react";
import Link from "next/link";

export default function ScoringPage() {
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<{ scored: number; message: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRunScoring() {
    setScoring(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/warehouse/score", { method: "POST" });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult({
        scored: data.scored ?? 0,
        message: data.message ?? "Scoring complete",
        timestamp: data.timestamp ?? new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScoring(false);
    }
  }

  return (
    <section>
      <h2>Run Scoring</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
        Click the button below to trigger the ML inference job. This runs the Python
        scoring script which generates late-delivery predictions for orders and writes
        them into the <code>order_predictions</code> table. After scoring completes,
        visit the <Link href="/warehouse/priority">Warehouse Priority Queue</Link> to
        see updated results.
      </p>

      <button onClick={handleRunScoring} disabled={scoring} style={{ marginBottom: 16 }}>
        {scoring ? "Scoring..." : "Run Scoring"}
      </button>

      {error && (
        <div className="card" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
          <div style={{ fontWeight: 600, color: "#dc2626" }}>Scoring Failed</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{error}</div>
        </div>
      )}

      {result && (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
          <div style={{ fontWeight: 600, color: "#16a34a" }}>Scoring Complete</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            <div><strong>Orders scored:</strong> {result.scored}</div>
            <div><strong>Status:</strong> {result.message}</div>
            <div><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</div>
          </div>
          <p style={{ marginTop: 12, fontSize: 14 }}>
            <Link href="/warehouse/priority">View Priority Queue &rarr;</Link>
          </p>
        </div>
      )}
    </section>
  );
}
