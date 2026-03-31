"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  product_id: number;
  product_name: string;
  price: number;
  category: string;
}

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

export default function PlaceOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingState, setShippingState] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProducts(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.product_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_id: p.product_id, product_name: p.product_name, price: p.price, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = shippingMethod === "express" ? 15.99 : shippingMethod === "overnight" ? 29.99 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingFee + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { setError("Add at least one item."); return; }
    if (!shippingState) { setError("Enter shipping state."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_state: shippingState,
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess(`Order #${data.order_id} placed successfully!`);
      setCart([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <p><Link href={`/customers/${id}`}>&larr; Back to dashboard</Link></p>
      <h2>Place Order</h2>

      {success && (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#86efac", marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{success}</p>
          <p style={{ margin: "8px 0 0" }}>
            <Link href={`/customers/${id}/orders`}>View order history</Link> |{" "}
            <Link href={`/customers/${id}`}>Back to dashboard</Link>
          </p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Products</h3>
      {loading && <p>Loading products...</p>}
      <div className="grid">
        {products.map((p) => (
          <div key={p.product_id} className="card">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.product_name}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>{p.category}</div>
            <div style={{ fontWeight: 700, margin: "4px 0" }}>${p.price.toFixed(2)}</div>
            <button type="button" onClick={() => addToCart(p)} style={{ fontSize: 13, padding: "6px 12px" }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Cart ({cart.length} items)</h3>
      {cart.length === 0 ? (
        <p>Cart is empty.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: 8 }}>Product</th>
                <th style={{ padding: 8 }}>Price</th>
                <th style={{ padding: 8 }}>Qty</th>
                <th style={{ padding: 8 }}>Line Total</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((i) => (
                <tr key={i.product_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 8 }}>{i.product_name}</td>
                  <td style={{ padding: 8 }}>${i.price.toFixed(2)}</td>
                  <td style={{ padding: 8 }}>{i.quantity}</td>
                  <td style={{ padding: 8 }}>${(i.price * i.quantity).toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    <button type="button" onClick={() => removeFromCart(i.product_id)} style={{ background: "#dc2626", fontSize: 12, padding: "4px 8px" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="card" style={{ marginBottom: 12 }}>
            <div>Subtotal: ${subtotal.toFixed(2)}</div>
            <div>Shipping: ${shippingFee.toFixed(2)}</div>
            <div>Tax (8%): ${tax.toFixed(2)}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>Total: ${total.toFixed(2)}</div>
          </div>

          <label>Shipping State</label>
          <input value={shippingState} onChange={(e) => setShippingState(e.target.value)} placeholder="e.g. UT" required />

          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="card">Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Bank Transfer</option>
          </select>

          <label>Shipping Method</label>
          <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
            <option value="standard">Standard ($5.99)</option>
            <option value="express">Express ($15.99)</option>
            <option value="overnight">Overnight ($29.99)</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      )}
    </section>
  );
}
