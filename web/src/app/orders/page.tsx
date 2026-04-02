"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderSummary {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean | null;
  late_delivery: boolean | null;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// Icon based on fraud + delivery status
function orderIcon(isFraud: boolean | null, isLate: boolean | null) {
  if (isFraud) return "🚨";
  if (isLate)  return "⏰";
  return "✅";
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all" | "fraud" | "late" | "ok">("all");

  useEffect(() => {
    const id = getCookie("customer_id");
    if (!id) { router.push("/select-customer"); return; }
    fetch(`/api/customers/${id}/orders`)
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error); else setOrders(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = orders.filter(o => {
    const matchSearch = o.order_id.toString().includes(search) ||
      new Date(o.order_datetime).toLocaleDateString().includes(search);
    const matchFilter =
      filter === "all"   ? true :
      filter === "fraud" ? o.is_fraud === true :
      filter === "late"  ? o.late_delivery === true :
      filter === "ok"    ? !o.is_fraud && !o.late_delivery : true;
    return matchSearch && matchFilter;
  });

  if (loading) return <p style={{ color: "#64748b" }}>Loading order history...</p>;
  if (error)   return <p style={{ color: "#dc2626" }}>{error}</p>;

  return (
    <>
      <div className="section-header">
        <h2>Order History</h2>
        <div className="section-divider" />
      </div>

      {/* Stats strip */}
      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card card-blue">
          <div className="label">Total Orders</div>
          <div className="value">{orders.length}</div>
        </div>
        <div className="card card-red">
          <div className="label">Flagged Fraud</div>
          <div className="value">{orders.filter(o => o.is_fraud).length}</div>
        </div>
        <div className="card card-orange" style={{ borderLeftColor: "#d97706" }}>
          <div className="label">Late Deliveries</div>
          <div className="value">{orders.filter(o => o.late_delivery).length}</div>
        </div>
        <div className="card card-green">
          <div className="label">All Good</div>
          <div className="value">{orders.filter(o => !o.is_fraud && !o.late_delivery).length}</div>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder="Search by order ID or date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "fraud", "late", "ok"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: filter === f ? "#0f172a" : "#f1f5f9",
                  color: filter === f ? "#fff" : "#334155",
                }}
              >
                {f === "all"   ? "All" :
                 f === "fraud" ? "🚨 Fraud" :
                 f === "late"  ? "⏰ Late" : "✅ OK"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
            No orders match your search.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Fraud</th>
                <th>Late Delivery</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.order_id}>
                  <td style={{ fontSize: 18 }}>
                    {orderIcon(o.is_fraud, o.late_delivery)}
                  </td>
                  <td style={{ fontWeight: 600 }}>#{o.order_id}</td>
                  <td>{new Date(o.order_datetime).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>${o.order_total.toFixed(2)}</td>
                  <td>
                    {o.is_fraud === null
                      ? <span className="badge badge-blue">Pending</span>
                      : o.is_fraud
                      ? <span className="badge badge-red">Fraud</span>
                      : <span className="badge badge-green">Clean</span>}
                  </td>
                  <td>
                    {o.late_delivery === null
                      ? <span className="badge badge-blue">N/A</span>
                      : o.late_delivery
                      ? <span className="badge badge-orange">Late</span>
                      : <span className="badge badge-green">On Time</span>}
                  </td>
                  <td>
                    <Link href={`/orders/${o.order_id}`}
                      style={{ fontSize: 13, fontWeight: 600 }}>
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, marginBottom: 0 }}>
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>
    </>
  );
}