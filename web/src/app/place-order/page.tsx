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

// Emoji icon per category
const CATEGORY_ICONS: Record<string, string> = {
  Electronics:  "💻",
  Garden:       "🌱",
  Automotive:   "🚗",
  Books:        "📚",
  Beauty:       "💄",
  Sports:       "⚽",
  Grocery:      "🛒",
  Apparel:      "👕",
  Toys:         "🧸",
  Home:         "🏠",
  Health:       "💊",
  Music:        "🎵",
  Tools:        "🔧",
};

function categoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] ?? "📦";
}

// Category pill colors
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "#eff6ff",
  Garden:      "#f0fdf4",
  Automotive:  "#fafafa",
  Books:       "#fefce8",
  Beauty:      "#fdf4ff",
  Sports:      "#fff7ed",
  Grocery:     "#f0fdf4",
  Apparel:     "#fdf2f8",
  Toys:        "#fffbeb",
  Home:        "#f0f9ff",
  Health:      "#fef2f2",
};

export default function PlaceOrderPage() {
  const router = useRouter();
  const [customerId, setCustomerId]       = useState<string | null>(null);
  const [products, setProducts]           = useState<Product[]>([]);
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [shippingState, setShippingState] = useState("");
  const [billingZip, setBillingZip]       = useState("");
  const [shippingZip, setShippingZip]     = useState("");
  const [sameZipAsBilling, setSameZipAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [promoUsed, setPromoUsed]         = useState(false);
  const [promoCode, setPromoCode]         = useState("");
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);

  useEffect(() => {
    const id = getCookie("customer_id");
    if (!id) { router.push("/select-customer"); return; }
    setCustomerId(id);
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch(`/api/customers/${id}`).then(r => r.json()),
    ])
      .then(([prodData, custData]) => {
        if (prodData.error) setError(prodData.error);
        else setProducts(prodData);
        if (custData?.zip_code) { setBillingZip(String(custData.zip_code)); setShippingZip(String(custData.zip_code)); }
        if (custData?.state)    setShippingState(String(custData.state));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  // Derived lists
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const filtered = products.filter(p => {
    const matchSearch   = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  function addToCart(p: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.product_id);
      if (ex) return prev.map(i => i.product_id === p.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: p.product_id, product_name: p.product_name, price: p.price, quantity: 1 }];
    });
  }

  function removeFromCart(id: number) {
    setCart(prev => prev.filter(i => i.product_id !== id));
  }

  const subtotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = shippingMethod === "express" ? 15.99 : shippingMethod === "overnight" ? 29.99 : 5.99;
  const tax         = subtotal * 0.08;
  const total       = subtotal + shippingFee + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0)       { setError("Add at least one item."); return; }
    if (!shippingState)          { setError("Enter shipping state."); return; }
    if (!billingZip.trim())      { setError("Enter billing ZIP."); return; }
    const shipZ = sameZipAsBilling ? billingZip.trim() : shippingZip.trim();
    if (!shipZ)                  { setError("Enter shipping ZIP."); return; }
    setSubmitting(true); setError(null);
    try {
      const res  = await fetch(`/api/customers/${customerId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_state: shippingState, payment_method: paymentMethod,
          shipping_method: shippingMethod, billing_zip: billingZip.trim(),
          shipping_zip: shipZ, promo_used: promoUsed,
          promo_code: promoUsed && promoCode.trim() ? promoCode.trim() : null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const fraudLine = data.fraud_probability != null
        ? ` Fraud probability: ${(Number(data.fraud_probability) * 100).toFixed(1)}%.` : "";
      setSuccess(`Order #${data.order_id} placed!${fraudLine}`);
      setCart([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!customerId) return null;

  return (
    <>
      <div className="section-header">
        <h2>Place Order</h2>
        <div className="section-divider" />
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{success}</p>
          <p style={{ margin: "6px 0 0" }}>
            <Link href="/orders">View order history</Link> ·{" "}
            <Link href="/dashboard">Dashboard</Link>
          </p>
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="order-layout">

        {/* ── LEFT: Products ── */}
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: 14 }}>
            <input
              placeholder="🔍  Search products or categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", fontSize: 14 }}
            />
          </div>

          {/* Category filter dropdown */}
          <div style={{ marginBottom: 16 }}>
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value)}
              style={{ width: "100%", fontSize: 14 }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : `${categoryIcon(cat)}  ${cat}`}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
            {loading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
          </p>

          {/* Product grid */}
          <div className="grid">
            {filtered.map(p => {
              const inCart   = cart.find(i => i.product_id === p.product_id);
              const bgColor  = CATEGORY_COLORS[p.category] ?? "#f8fafc";
              return (
                <div key={p.product_id} className="card"
                  style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>

                  {/* Category badge */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: bgColor, borderRadius: 20,
                    padding: "3px 10px", fontSize: 11, fontWeight: 600,
                    color: "#475569", marginBottom: 8, alignSelf: "flex-start"
                  }}>
                    {categoryIcon(p.category)} {p.category}
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {p.product_name}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 17 }}>${p.price.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      style={{
                        fontSize: 12, padding: "5px 12px",
                        background: inCart ? "#16a34a" : "#1d4ed8",
                      }}
                    >
                      {inCart ? `✓ ${inCart.quantity} in cart` : "+ Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Cart & Checkout ── */}
        <div className="cart-sidebar">
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>
              Cart
              {cart.length > 0 && (
                <span className="badge badge-blue" style={{ marginLeft: 8 }}>{cart.length}</span>
              )}
            </h3>

            {cart.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Add items from the left to get started.</p>
            ) : (
              <>
                {cart.map(i => (
                  <div key={i.product_id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {categoryIcon(products.find(p => p.product_id === i.product_id)?.category ?? "")} {i.product_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {i.quantity} × ${i.price.toFixed(2)} = ${(i.price * i.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(i.product_id)}
                      style={{ background: "transparent", color: "#dc2626", fontSize: 18, padding: "2px 6px", border: "none" }}>
                      ×
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 2, borderTop: "2px solid #e2e8f0", paddingTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Shipping</span><span>${shippingFee.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Tax (8%)</span><span>${tax.toFixed(2)}</span>
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
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Checkout</h3>

              <label>Billing ZIP</label>
              <input value={billingZip} onChange={e => { setBillingZip(e.target.value); if (sameZipAsBilling) setShippingZip(e.target.value); }} placeholder="e.g. 28289" required />

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <input type="checkbox" checked={sameZipAsBilling} onChange={e => { setSameZipAsBilling(e.target.checked); if (e.target.checked) setShippingZip(billingZip); }} />
                Shipping ZIP same as billing
              </label>

              {!sameZipAsBilling && (
                <><label>Shipping ZIP</label><input value={shippingZip} onChange={e => setShippingZip(e.target.value)} placeholder="ZIP" required /></>
              )}

              <label>Shipping state</label>
              <input value={shippingState} onChange={e => setShippingState(e.target.value)} placeholder="e.g. CA" required />

              <label>Payment method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="card">💳 Card</option>
                <option value="paypal">🅿️ PayPal</option>
                <option value="bank">🏦 Bank Transfer</option>
              </select>

              <label>Shipping method</label>
              <select value={shippingMethod} onChange={e => setShippingMethod(e.target.value)}>
                <option value="standard">📦 Standard ($5.99)</option>
                <option value="express">⚡ Express ($15.99)</option>
                <option value="overnight">🌙 Overnight ($29.99)</option>
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <input type="checkbox" checked={promoUsed} onChange={e => setPromoUsed(e.target.checked)} />
                Using promo code
              </label>
              {promoUsed && (
                <><label>Promo code</label><input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="SAVE10" /></>
              )}

              <button type="submit" disabled={submitting} style={{ marginTop: 8, width: "100%", padding: "12px" }}>
                {submitting ? "Placing order..." : "Place order"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}