"use client";

import { useState } from "react";

type PredictionResult = { prediction: number; probability: number };

function isPredictionResult(data: unknown): data is PredictionResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.prediction === "number" &&
    typeof o.probability === "number" &&
    Number.isFinite(o.probability)
  );
}

export default function FraudPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    let data: unknown;
    try {
      const res = await fetch("/api/predict/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data
            ? String((data as { error: unknown }).error)
            : res.statusText;
        setError(msg || "Prediction failed");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return;
    } finally {
      setLoading(false);
    }

    if (!isPredictionResult(data)) {
      const errMsg =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : "Invalid response from server";
      setError(errMsg);
      return;
    }
    setResult(data);
  }

  const prob = result ? result.probability * 100 : 0;
  const isFraud = result?.prediction === 1;

  return (
    <>
      <div className="section-header">
        <h2>Fraud Detection</h2>
        <div className="section-divider" />
      </div>

      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>
        <strong>Production:</strong> Scores on real orders live in Supabase after the nightly GitHub Action runs{" "}
        <code>score_orders.py</code>. This page calls <code>/api/predict/fraud</code> (Python + scikit-learn) — works
        locally with <code>PYTHON_BIN</code>; on Vercel use <strong>Order history</strong> for stored model scores.
      </p>

      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Enter order details below to get a real-time fraud prediction using the trained fraud model.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* ── Form ── */}
        <form onSubmit={onSubmit}>

          {/* Order details */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Order Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Order Total ($)</label>
                <input name="order_total" type="number" step="0.01" defaultValue="120.50" required />
              </div>
              <div>
                <label>Order Subtotal ($)</label>
                <input name="order_subtotal" type="number" step="0.01" defaultValue="110.00" required />
              </div>
              <div>
                <label>Shipping Fee ($)</label>
                <input name="shipping_fee" type="number" step="0.01" defaultValue="5.00" required />
              </div>
              <div>
                <label>Tax Amount ($)</label>
                <input name="tax_amount" type="number" step="0.01" defaultValue="5.50" required />
              </div>
              <div>
                <label>Risk Score (0–100)</label>
                <input name="risk_score" type="number" step="0.1" min="0" max="100" defaultValue="60" required />
              </div>
              <div>
                <label>Promo Used</label>
                <select name="promo_used" defaultValue="0">
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment & device */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Payment & Device</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Payment Method</label>
                <select name="payment_method" defaultValue="card">
                  <option value="card">Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bank</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              <div>
                <label>Device Type</label>
                <select name="device_type" defaultValue="mobile">
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
              <div>
                <label>IP Country</label>
                <select name="ip_country" defaultValue="US">
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                  <option value="GB">GB</option>
                  <option value="IN">IN</option>
                  <option value="BR">BR</option>
                  <option value="NG">NG</option>
                </select>
              </div>
              <div>
                <label>Items in Order</label>
                <input name="items_per_order" type="number" min="1" defaultValue="2" required />
              </div>
              <div>
                <label>Unique Products</label>
                <input name="unique_products" type="number" min="1" defaultValue="2" required />
              </div>
              <div>
                <label>Avg Item Price ($)</label>
                <input name="avg_item_price" type="number" step="0.01" defaultValue="55.00" required />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Shipping</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Shipping Method</label>
                <select name="shipping_method" defaultValue="standard">
                  <option value="standard">Standard</option>
                  <option value="expedited">Expedited</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>
              <div>
                <label>Distance Band</label>
                <select name="distance_band" defaultValue="regional">
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="national">National</option>
                </select>
              </div>
              <div>
                <label>Origin State</label>
                <input name="state" defaultValue="CA" required />
              </div>
              <div>
                <label>Shipping State</label>
                <input name="shipping_state" defaultValue="CA" required />
              </div>
              <div>
                <label>Promised Days</label>
                <input name="promised_days" type="number" min="1" defaultValue="3" required />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Customer</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Customer Segment</label>
                <select name="customer_segment" defaultValue="standard">
                  <option value="standard">Standard</option>
                  <option value="budget">Budget</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label>Loyalty Tier</label>
                <select name="loyalty_tier" defaultValue="silver">
                  <option value="none">None</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div>
                <label>Gender</label>
                <select name="gender" defaultValue="Female">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
              <div>
                <label>Customer Age</label>
                <input name="customer_age" type="number" min="18" max="100" defaultValue="31" required />
              </div>
              <div>
                <label>Account Age (days)</label>
                <input name="account_age_days" type="number" min="0" defaultValue="250" required />
              </div>
            </div>
          </div>

          <button type="submit" style={{ width: "100%", padding: "12px" }}>
            {loading ? "Running model..." : "Predict Fraud Risk"}
          </button>
        </form>

        {/* ── Result panel ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Prediction Result</h3>
            {!result && !loading && (
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                Fill in the form and click "Predict Fraud Risk" to see the result.
              </p>
            )}
            {loading && (
              <p style={{ color: "#64748b", fontSize: 14 }}>Running model...</p>
            )}
            {error && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: 10,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 14,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}
            {result && (
              <>
                <div style={{
                  padding: "16px",
                  borderRadius: 10,
                  background: isFraud ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${isFraud ? "#fecaca" : "#86efac"}`,
                  marginBottom: 16,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {isFraud ? "⚠️" : "✓"}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700,
                    color: isFraud ? "#dc2626" : "#16a34a"
                  }}>
                    {isFraud ? "Fraud Detected" : "Legitimate Order"}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    Fraud probability: <strong>{prob.toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Probability bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 12, color: "#64748b", marginBottom: 4
                  }}>
                    <span>0%</span>
                    <span>Fraud probability</span>
                    <span>100%</span>
                  </div>
                  <div style={{ background: "#f1f5f9", borderRadius: 8, height: 12, overflow: "hidden" }}>
                    <div style={{
                      width: `${prob}%`,
                      height: "100%",
                      background: prob > 50 ? "#dc2626" : prob > 25 ? "#d97706" : "#16a34a",
                      borderRadius: 8,
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Info card */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>About this model</h3>
            <table style={{ fontSize: 13 }}>
              <tbody>
                <tr><td style={{ color: "#64748b", paddingBottom: 6 }}>Algorithm</td><td style={{ fontWeight: 600 }}>Gradient Boosting</td></tr>
                <tr><td style={{ color: "#64748b", paddingBottom: 6 }}>AUC-ROC</td><td style={{ fontWeight: 600 }}>0.964</td></tr>
                <tr><td style={{ color: "#64748b", paddingBottom: 6 }}>Recall</td><td style={{ fontWeight: 600 }}>77.4%</td></tr>
                <tr><td style={{ color: "#64748b", paddingBottom: 6 }}>Precision</td><td style={{ fontWeight: 600 }}>71.2%</td></tr>
                <tr><td style={{ color: "#64748b" }}>Training data</td><td style={{ fontWeight: 600 }}>5,000 orders</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}