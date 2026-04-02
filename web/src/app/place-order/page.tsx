"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function PlaceOrderPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingState, setShippingState] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [sameZipAsBilling, setSameZipAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [promoUsed, setPromoUsed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const id = getCookie("customer_id");
    if (!id) { router.push("/select-customer"); return; }
    setCustomerId(id);

    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch(`/api/customers/${id}`).then((r) => r.json()),
    ])
      .then(([prodData, custData]) => {
        if (prodData.error) setError(prodData.error);
        else setProducts(prodData);
        if (custData && !custData.error && custData.zip_code) {
          const z = String(custData.zip_code);
          setBillingZip(z);
          setShippingZip(z);
        }
        if (custData && !custData.error && custData.state) {
          setShippingState(String(custData.state));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

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
    if (!billingZip.trim()) { setError("Enter billing ZIP."); return; }
    const shipZ = sameZipAsBilling ? billingZip.trim() : shippingZip.trim();
    if (!shipZ) { setError("Enter shipping ZIP or use same as billing."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_state: shippingState,
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          billing_zip: billingZip.trim(),
          shipping_zip: shipZ,
          promo_used: promoUsed,
          promo_code: promoUsed && promoCode.trim() ? promoCode.trim() : null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const fraudLine =
        data.fraud_probability != null
          ? ` Model fraud probability: ${(Number(data.fraud_probability) * 100).toFixed(1)}%.`
          : "";
      setSuccess(`Order #${data.order_id} placed successfully!${fraudLine}`);
      setCart([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!customerId) return null;

  return (
    <section>
      <h2>Place Order</h2>

      {success && (
        <div className="alert alert-success">
          <p style={{ margin: 0, fontWeight: 600 }}>{success}</p>
          <p style={{ margin: "6px 0 0" }}>
            <Link href="/orders">View order history</Link> |{" "}
            <Link href="/dashboard">Back to dashboard</Link>
          </p>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="order-layout">
        {/* Left column: Products */}
        <div>
          <h3 style={{ marginTop: 0 }}>Products</h3>
          {loading && <p>Loading products...</p>}
          <div className="grid">
            {products.map((p) => (
              <div key={p.product_id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.product_name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{p.category}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>${p.price.toFixed(2)}</span>
                  <button type="button" onClick={() => addToCart(p)} style={{ fontSize: 12, padding: "5px 10px" }}>
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Cart & Checkout */}
        <div className="cart-sidebar">
          <div className="card">
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>
              Cart
              {cart.length > 0 && <span className="badge badge-blue" style={{ marginLeft: 8 }}>{cart.length}</span>}
            </h3>

            {cart.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 14 }}>Add items from the left to get started.</p>
            ) : (
              <>
                {cart.map((i) => (
                  <div key={i.product_id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 14,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{i.product_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {i.quantity} &times; ${i.price.toFixed(2)} = ${(i.price * i.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(i.product_id)}
                      style={{ background: "transparent", color: "#dc2626", fontSize: 18, padding: "2px 6px", lineHeight: 1, border: "none" }}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, borderTop: "2px solid #e2e8f0", paddingTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Shipping</span><span>${shippingFee.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 4, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <form onSubmit={handleSubmit} className="card">
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Checkout</h3>

              <label>Billing ZIP</label>
              <input
                value={billingZip}
                onChange={(e) => {
                  setBillingZip(e.target.value);
                  if (sameZipAsBilling) setShippingZip(e.target.value);
                }}
                placeholder="e.g. 28289"
                required
              />

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={sameZipAsBilling}
                  onChange={(e) => {
                    setSameZipAsBilling(e.target.checked);
                    if (e.target.checked) setShippingZip(billingZip);
                  }}
                />
                Shipping ZIP same as billing
              </label>

              {!sameZipAsBilling && (
                <>
                  <label>Shipping ZIP</label>
                  <input value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="ZIP" required />
                </>
              )}

              <label>Shipping state</label>
              <input value={shippingState} onChange={(e) => setShippingState(e.target.value)} placeholder="e.g. UT" required />

              <label>Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
              </select>

              <label>Shipping method</label>
              <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                <option value="standard">Standard ($5.99)</option>
                <option value="express">Express ($15.99)</option>
                <option value="overnight">Overnight ($29.99)</option>
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <input type="checkbox" checked={promoUsed} onChange={(e) => setPromoUsed(e.target.checked)} />
                Using promo code
              </label>
              {promoUsed && (
                <>
                  <label>Promo code</label>
                  <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="SAVE10" />
                </>
              )}

              <button type="submit" disabled={submitting} style={{ marginTop: 4 }}>
                {submitting ? "Placing order…" : "Place order"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
