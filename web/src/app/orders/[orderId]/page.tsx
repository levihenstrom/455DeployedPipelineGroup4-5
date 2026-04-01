"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  order_id: number;
  order_datetime: string;
  order_total: number;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  payment_method: string;
  is_fraud: boolean;
  shipping_method: string | null;
  late_delivery: boolean | null;
  carrier: string | null;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getCookie("customer_id");
    if (!id) { router.push("/select-customer"); return; }

    fetch(`/api/customers/${id}/orders?detail=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        const found = data.find((o: Order) => String(o.order_id) === orderId);
        if (found) setOrder(found);
        else setError("Order not found.");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) return <p>Loading order details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <section>
      <p><Link href="/orders">&larr; Back to orders</Link></p>
      <h2>Order #{order.order_id}</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div><strong>Date:</strong> {new Date(order.order_datetime).toLocaleDateString()}</div>
        <div><strong>Payment:</strong> {order.payment_method}</div>
        <div><strong>Shipping:</strong> {order.shipping_method ?? "N/A"} | Carrier: {order.carrier ?? "N/A"}</div>
        <div style={{ marginTop: 8 }}>
          <strong>Subtotal:</strong> ${order.order_subtotal.toFixed(2)} |{" "}
          <strong>Shipping:</strong> ${order.shipping_fee.toFixed(2)} |{" "}
          <strong>Tax:</strong> ${order.tax_amount.toFixed(2)} |{" "}
          <strong>Total:</strong> ${order.order_total.toFixed(2)}
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          {order.is_fraud && <span style={{ color: "#dc2626", fontWeight: 600, marginRight: 8 }}>Flagged Fraud</span>}
          {order.late_delivery === true && <span style={{ color: "#d97706", fontWeight: 600 }}>Late Delivery</span>}
          {order.late_delivery === false && <span style={{ color: "#16a34a" }}>On Time</span>}
        </div>
      </div>

      <h3>Line Items</h3>
      {order.items && order.items.length > 0 ? (
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Product</th>
              <th style={{ padding: 8 }}>Qty</th>
              <th style={{ padding: 8 }}>Price</th>
              <th style={{ padding: 8 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 8 }}>{item.product_name}</td>
                <td style={{ padding: 8 }}>{item.quantity}</td>
                <td style={{ padding: 8 }}>${item.unit_price.toFixed(2)}</td>
                <td style={{ padding: 8 }}>${item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No line items found.</p>
      )}
    </section>
  );
}
