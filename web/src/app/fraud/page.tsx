"use client";

import { useState } from "react";

type PredictionResult = { prediction: number; probability: number };

export default function FraudPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/predict/fraud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await res.json()) as PredictionResult;
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="card">
      <h2>Fraud Prediction</h2>
      <form action={onSubmit}>
        <input name="order_total" type="number" step="0.01" placeholder="order_total" defaultValue="120.50" required />
        <input name="order_subtotal" type="number" step="0.01" placeholder="order_subtotal" defaultValue="110.00" required />
        <input name="shipping_fee" type="number" step="0.01" placeholder="shipping_fee" defaultValue="5.00" required />
        <input name="tax_amount" type="number" step="0.01" placeholder="tax_amount" defaultValue="5.50" required />
        <input name="risk_score" type="number" step="0.01" placeholder="risk_score" defaultValue="60.00" required />
        <select name="payment_method" defaultValue="card">
          <option value="card">card</option>
          <option value="paypal">paypal</option>
          <option value="bank">bank</option>
          <option value="crypto">crypto</option>
        </select>
        <select name="device_type" defaultValue="mobile">
          <option value="mobile">mobile</option>
          <option value="desktop">desktop</option>
          <option value="tablet">tablet</option>
        </select>
        <input name="ip_country" defaultValue="US" required />
        <input name="promo_used" type="number" min="0" max="1" defaultValue="0" required />
        <input name="customer_segment" defaultValue="standard" required />
        <input name="loyalty_tier" defaultValue="silver" required />
        <input name="gender" defaultValue="Female" required />
        <input name="state" defaultValue="CA" required />
        <input name="shipping_state" defaultValue="CA" required />
        <input name="shipping_method" defaultValue="standard" required />
        <input name="distance_band" defaultValue="regional" required />
        <input name="promised_days" type="number" defaultValue="3" required />
        <input name="actual_days" type="number" defaultValue="3" required />
        <input name="items_per_order" type="number" defaultValue="2" required />
        <input name="unique_products" type="number" defaultValue="2" required />
        <input name="avg_item_price" type="number" step="0.01" defaultValue="55.00" required />
        <input name="customer_age" type="number" step="0.1" defaultValue="31" required />
        <input name="account_age_days" type="number" defaultValue="250" required />
        <input name="shipping_to_subtotal_ratio" type="number" step="0.0001" defaultValue="0.0455" required />
        <input name="tax_to_subtotal_ratio" type="number" step="0.0001" defaultValue="0.0500" required />
        <button type="submit">{loading ? "Predicting..." : "Predict Fraud"}</button>
      </form>
      {result && (
        <p>
          Prediction: <strong>{result.prediction === 1 ? "Fraud Risk" : "Not Fraud"}</strong> ({(result.probability * 100).toFixed(2)}%)
        </p>
      )}
    </div>
  );
}
