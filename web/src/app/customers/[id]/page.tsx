"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  gender: string;
  customer_segment: string;
  loyalty_tier: string;
  city: string;
  state: string;
}

interface OrderSummary {
  order_id: number;
  order_datetime: string;
  order_total: number;
  is_fraud: boolean;
  late_delivery: boolean | null;
}

export default function CustomerDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then((r) => r.json()),
      fetch(`/api/customers/${id}/orders`).then((r) => r.json()),
    ])
      .then(([cust, ords]) => {
        if (cust.error) setError(cust.error);
        else setCustomer(cust);
        if (!ords.error) setOrders(ords);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!customer) return <p>Customer not found.</p>;

  const totalSpent = orders.reduce((s, o) => s + o.order_total, 0);

  return (
    <section>
      <p><Link href="/customers">&larr; Back to customers</Link></p>
      <h2>{customer.full_name}</h2>

      <div className="grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="label">Email</div>
          <div style={{ fontSize: 14 }}>{customer.email}</div>
        </div>
        <div className="card">
          <div className="label">Segment / Tier</div>
          <div style={{ fontSize: 14 }}>{customer.customer_segment} &middot; {customer.loyalty_tier}</div>
        </div>
        <div className="card">
          <div className="label">Location</div>
          <div style={{ fontSize: 14 }}>{customer.city}, {customer.state}</div>
        </div>
        <div className="card">
          <div className="label">Total Orders</div>
          <div className="value">{orders.length}</div>
        </div>
        <div className="card">
          <div className="label">Total Spent</div>
          <div className="value">${totalSpent.toFixed(2)}</div>
        </div>
      </div>

      <h3>Actions</h3>
      <p>
        <Link href={`/customers/${id}/order`}>
          <button type="button">Place New Order</button>
        </Link>{" "}
        <Link href={`/customers/${id}/orders`}>
          <button type="button" style={{ background: "#475569" }}>View Order History</button>
        </Link>
      </p>

      <h3>Recent Orders</h3>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: 8 }}>Order ID</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Fraud</th>
              <th style={{ padding: 8 }}>Late</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((o) => (
              <tr key={o.order_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: 8 }}>{o.order_id}</td>
                <td style={{ padding: 8 }}>{new Date(o.order_datetime).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>${o.order_total.toFixed(2)}</td>
                <td style={{ padding: 8 }}>{o.is_fraud ? "Yes" : "No"}</td>
                <td style={{ padding: 8 }}>{o.late_delivery == null ? "N/A" : o.late_delivery ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
