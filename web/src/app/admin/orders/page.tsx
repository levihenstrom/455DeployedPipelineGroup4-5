"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminOrdersChart, type DayCount } from "@/components/AdminOrdersChart";

type Row = {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean | null;
  fraud_probability: number | null;
  risk_score: number;
  customer_name: string;
};

type Stats = {
  ordersByDay: DayCount[];
  pendingReviewCount: number;
  totalOrders: number;
};

export default function AdminOrdersDashboardPage() {
  const [queue, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/orders?queue=pending").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ])
      .then(([orderData, statData]) => {
        if (orderData.error) setError(orderData.error);
        else setRows(Array.isArray(orderData) ? orderData : []);
        if (statData.error) setError(statData.error);
        else
          setStats({
            ordersByDay: statData.ordersByDay ?? [],
            pendingReviewCount: statData.pendingReviewCount ?? 0,
            totalOrders: statData.totalOrders ?? 0,
          });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setLabel(orderId: number, isFraud: boolean) {
    setUpdating(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_fraud: isFraud }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.order_id !== orderId));
      const st = await fetch("/api/admin/stats").then((r) => r.json());
      if (!st.error) {
        setStats({
          ordersByDay: st.ordersByDay ?? [],
          pendingReviewCount: st.pendingReviewCount ?? 0,
          totalOrders: st.totalOrders ?? 0,
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Admin dashboard</h2>
        <Link href="/admin/history" style={{ fontSize: 14, fontWeight: 600 }}>
          Full order history →
        </Link>
      </div>

      {stats && (
        <div className="grid" style={{ marginTop: 20, marginBottom: 8 }}>
          <div className="card card-blue">
            <div className="label">Pending review</div>
            <div className="value" style={{ fontSize: 26 }}>
              {stats.pendingReviewCount}
            </div>
          </div>
          <div className="card">
            <div className="label">Total orders (DB)</div>
            <div className="value" style={{ fontSize: 26 }}>
              {stats.totalOrders}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Orders over time (30 days)</h3>
        {stats && <AdminOrdersChart data={stats.ordersByDay} />}
      </div>

      <h3 style={{ fontSize: 17, marginBottom: 8 }}>Review queue</h3>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
        New orders appear here until you label them. <strong>Model score</strong> is a hint only; your choice is the
        source of truth.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={load} disabled={loading} style={{ background: "#475569" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && <p>Loading…</p>}

      {!loading && queue.length === 0 && !error && (
        <div className="card" style={{ background: "#f8fafc", borderStyle: "dashed" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#334155" }}>No new orders</p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748b" }}>
            Nothing is waiting for a fraud label. New checkouts will show up here with a model score until you mark
            Legit or Fraud.
          </p>
        </div>
      )}

      {queue.length > 0 && (
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th>Order</th>
                <th>When</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Model P(fraud)</th>
                <th>Your label</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((r) => (
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={updating === r.order_id}
                        onClick={() => setLabel(r.order_id, false)}
                        style={{ background: "#16a34a", padding: "6px 12px", fontSize: 12 }}
                      >
                        Legit
                      </button>
                      <button
                        type="button"
                        disabled={updating === r.order_id}
                        onClick={() => setLabel(r.order_id, true)}
                        style={{ background: "#dc2626", padding: "6px 12px", fontSize: 12 }}
                      >
                        Fraud
                      </button>
                    </div>
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
