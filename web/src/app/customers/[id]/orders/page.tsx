"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Order {
  order_id: number;
  order_datetime: string;
  order_total: number;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  payment_method: string;
  is_fraud: boolean | null;
  shipping_method: string | null;
  late_delivery: boolean | null;
  carrier: string | null;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
}

export default function OrderHistoryPage() {
  const params = useParams();
  const id = params.id as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}/orders?detail=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrders(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading order history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <section>
      <p><Link href={`/customers/${id}`}>&larr; Back to dashboard</Link></p>
      <h2>Order History</h2>
      {orders.length === 0 ? (
        <p>No orders found for this customer.</p>
      ) : (
        orders.map((o) => (
          <div key={o.order_id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Order #{o.order_id}</strong>
                <span style={{ marginLeft: 12, fontSize: 13, color: "#475569" }}>
                  {new Date(o.order_datetime).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontWeight: 700 }}>${o.order_total.toFixed(2)}</div>
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
              Payment: {o.payment_method} | Shipping: {o.shipping_method ?? "N/A"} | Carrier: {o.carrier ?? "N/A"}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {o.is_fraud === null && (
                <span style={{ color: "#64748b", fontWeight: 600, marginRight: 8 }}>Fraud review pending</span>
              )}
              {o.is_fraud === true && (
                <span style={{ color: "#dc2626", fontWeight: 600, marginRight: 8 }}>Flagged fraud</span>
              )}
              {o.is_fraud === false && (
                <span style={{ color: "#16a34a", fontWeight: 600, marginRight: 8 }}>Not fraud</span>
              )}
              {o.late_delivery === true && <span style={{ color: "#d97706", fontWeight: 600 }}>Late Delivery</span>}
              {o.late_delivery === false && <span style={{ color: "#16a34a" }}>On Time</span>}
            </div>
            {o.items && o.items.length > 0 && (
              <table style={{ width: "100%", fontSize: 13, marginTop: 8, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: 4 }}>Product</th>
                    <th style={{ padding: 4 }}>Qty</th>
                    <th style={{ padding: 4 }}>Price</th>
                    <th style={{ padding: 4 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 4 }}>{item.product_name}</td>
                      <td style={{ padding: 4 }}>{item.quantity}</td>
                      <td style={{ padding: 4 }}>${item.unit_price.toFixed(2)}</td>
                      <td style={{ padding: 4 }}>${item.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}
    </section>
  );
}
