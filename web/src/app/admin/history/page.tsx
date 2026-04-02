"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean | null;
  fraud_probability: number | null;
  customer_name: string;
};

function labelText(is_fraud: boolean | null) {
  if (is_fraud === null) return "Pending";
  return is_fraud ? "Fraud" : "Legit";
}

export default function AdminHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/orders?queue=all")
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

  return (
    <section>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Full order history</h2>
        <Link href="/admin/orders" style={{ fontSize: 14, fontWeight: 600 }}>
          ← Review queue
        </Link>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
        All orders (newest first, up to 500). Label column reflects admin decision; <strong>Pending</strong> means
        still in the review queue.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={load} disabled={loading} style={{ background: "#475569" }}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && <p>Loading…</p>}

      {!loading && rows.length === 0 && !error && <p>No orders.</p>}

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
                <th>Label</th>
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
                      "—"
                    ) : (
                      `${(r.fraud_probability * 100).toFixed(1)}%`
                    )}
                  </td>
                  <td>
                    {r.is_fraud === null && <span className="badge badge-orange">{labelText(null)}</span>}
                    {r.is_fraud === true && <span className="badge badge-red">{labelText(true)}</span>}
                    {r.is_fraud === false && <span className="badge badge-green">{labelText(false)}</span>}
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
