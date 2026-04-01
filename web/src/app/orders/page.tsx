"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderSummary {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean;
  late_delivery: boolean | null;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getCookie("customer_id");
    if (!id) { router.push("/select-customer"); return; }

    fetch(`/api/customers/${id}/orders`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrders(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p>Loading order history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <section>
      <p><Link href="/dashboard">&larr; Back to dashboard</Link></p>
      <h2>Order History</h2>
      {orders.length === 0 ? (
        <p>No orders found for this customer.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: 8 }}>Order ID</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Fraud</th>
              <th style={{ padding: 8 }}>Late</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: 8 }}>{o.order_id}</td>
                <td style={{ padding: 8 }}>{new Date(o.order_datetime).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>${o.order_total.toFixed(2)}</td>
                <td style={{ padding: 8 }}>{o.is_fraud ? "Yes" : "No"}</td>
                <td style={{ padding: 8 }}>{o.late_delivery == null ? "N/A" : o.late_delivery ? "Yes" : "No"}</td>
                <td style={{ padding: 8 }}>
                  <Link href={`/orders/${o.order_id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
