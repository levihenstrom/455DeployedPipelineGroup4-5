"use client";

import { useEffect, useState } from "react";

interface QueueItem {
  order_id: number;
  customer_name: string;
  order_total: number;
  order_datetime: string;
  shipping_state: string;
  shipping_method: string | null;
  carrier: string | null;
  late_probability: number;
}

export default function WarehousePriorityPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  function loadQueue() {
    setLoading(true);
    setError(null);
    fetch("/api/warehouse/queue")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setQueue(data);
          setLastRefresh(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadQueue(); }, []);

  return (
    <section>
      <h2>Late Delivery Priority Queue</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>
        This queue shows the top 50 orders ranked by their predicted probability of late delivery.
        Orders at the top should be prioritized by the warehouse for fulfillment to reduce delays.
        {lastRefresh && <span> Last refreshed: {lastRefresh}</span>}
      </p>
      <div style={{ marginBottom: 16 }}>
        <button onClick={loadQueue} disabled={loading} style={{ background: "#475569" }}>
          {loading ? "Refreshing..." : "Refresh Queue"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading queue...</p>}

      {!loading && queue.length === 0 && !error && (
        <p>
          No model-scored orders in the queue. Run{" "}
          <code>python ml/src/score_late_delivery_predictions.py</code> with <code>DATABASE_URL</code>, or let the nightly
          GitHub Action write <code>order_predictions</code> (no shipment-outcome shortcuts).
        </p>
      )}

      {queue.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Order ID</th>
                <th style={{ padding: 8 }}>Customer</th>
                <th style={{ padding: 8 }}>Total</th>
                <th style={{ padding: 8 }}>State</th>
                <th style={{ padding: 8 }}>Shipping</th>
                <th style={{ padding: 8 }}>Carrier</th>
                <th style={{ padding: 8 }}>Late Probability</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item, idx) => (
                <tr key={item.order_id} style={{ borderBottom: "1px solid #e2e8f0", background: idx < 10 ? "#fef2f2" : undefined }}>
                  <td style={{ padding: 8 }}>{idx + 1}</td>
                  <td style={{ padding: 8 }}>{item.order_id}</td>
                  <td style={{ padding: 8 }}>{item.customer_name}</td>
                  <td style={{ padding: 8 }}>${item.order_total.toFixed(2)}</td>
                  <td style={{ padding: 8 }}>{item.shipping_state}</td>
                  <td style={{ padding: 8 }}>{item.shipping_method ?? "N/A"}</td>
                  <td style={{ padding: 8 }}>{item.carrier ?? "N/A"}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      fontWeight: 700,
                      color: item.late_probability > 0.7 ? "#dc2626" : item.late_probability > 0.4 ? "#d97706" : "#16a34a"
                    }}>
                      {(item.late_probability * 100).toFixed(1)}%
                    </span>
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
