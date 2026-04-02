"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean;
  fraud_probability: number | null;
  risk_score: number;
  customer_name: string;
};

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFraud(orderId: number, next: boolean) {
    setUpdating(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_fraud: next }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.order_id === orderId ? { ...r, is_fraud: next } : r))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section>
      <h2>Order dashboard</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
        All orders, newest first (up to 500). <strong>Admin fraud</strong> is ground truth you set;{" "}
        <strong>Model</strong> is the fraud classifier score at checkout. Retraining the model on your labels
        is a separate scheduled job (see Pipeline).
      </p>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={load} disabled={loading} style={{ background: "#475569" }}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && <p>Loading orders…</p>}

      {!loading && rows.length === 0 && !error && <p>No orders found.</p>}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th>Order</th>
                <th>When</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Model P(fraud)</th>
                <th>Admin fraud</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.order_id}>
                  <td style={{ fontFamily: "ui-monospace, monospace" }}>{r.order_id}</td>
                  <td>{new Date(r.order_datetime).toLocaleString()}</td>
                  <td>{r.customer_name}</td>
                  <td>${Number(r.order_total).toFixed(2)}</td>
                  <td>
                    {r.fraud_probability == null ? (
                      <span className="badge badge-orange">N/A</span>
                    ) : (
                      <span className="badge badge-blue">{(r.fraud_probability * 100).toFixed(1)}%</span>
                    )}
                  </td>
                  <td>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={r.is_fraud}
                        disabled={updating === r.order_id}
                        onChange={(e) => toggleFraud(r.order_id, e.target.checked)}
                      />
                      <span>{r.is_fraud ? "Fraud" : "Legit"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
