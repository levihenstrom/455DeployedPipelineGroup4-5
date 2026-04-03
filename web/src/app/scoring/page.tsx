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
        <strong>Fraud (batch):</strong> Nightly,{" "}
        <a href="https://docs.github.com/en/actions" target="_blank" rel="noreferrer">
          GitHub Actions
        </a>{" "}
        runs <code>ml/src/score_orders.py</code> using the repo secret <code>DATABASE_URL</code> (Supabase
        Postgres). It fills <code>orders.fraud_probability</code>, <code>fraud_predicted</code>, and{" "}
        <code>fraud_scored_at</code>. The customer <Link href="/orders">order history</Link> and dashboard
        read those columns—no Python on Vercel required.
      </p>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
        <strong>Late delivery (this button):</strong> Triggers the warehouse scoring API (heuristic /
        Supabase tables). After it completes, open the{" "}
        <Link href="/warehouse/priority">Warehouse Priority Queue</Link>.
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
