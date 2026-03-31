"use client";

import { useState } from "react";

type PredictionResult = { prediction: number; probability: number };

export default function DeliveryPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/predict/delivery", {
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
      <h2>Late Delivery Prediction</h2>
      <form action={onSubmit}>
        <input name="carrier" defaultValue="UPS" required />
        <input name="shipping_method" defaultValue="standard" required />
        <input name="distance_band" defaultValue="regional" required />
        <input name="promised_days" type="number" defaultValue="3" required />
        <input name="actual_days" type="number" defaultValue="4" required />
        <input name="actual_minus_promised" type="number" defaultValue="1" required />
        <input name="hours_to_ship" type="number" step="0.01" defaultValue="16" required />
        <input name="shipping_state" defaultValue="CA" required />
        <input name="state" defaultValue="CA" required />
        <input name="order_total" type="number" step="0.01" defaultValue="120.50" required />
        <input name="order_subtotal" type="number" step="0.01" defaultValue="110.00" required />
        <input name="shipping_fee" type="number" step="0.01" defaultValue="5.00" required />
        <input name="tax_amount" type="number" step="0.01" defaultValue="5.50" required />
        <input name="shipping_to_subtotal_ratio" type="number" step="0.0001" defaultValue="0.0455" required />
        <input name="payment_method" defaultValue="card" required />
        <input name="device_type" defaultValue="mobile" required />
        <input name="ip_country" defaultValue="US" required />
        <input name="promo_used" type="number" min="0" max="1" defaultValue="0" required />
        <input name="customer_segment" defaultValue="standard" required />
        <input name="loyalty_tier" defaultValue="silver" required />
        <input name="total_items" type="number" defaultValue="2" required />
        <input name="unique_products" type="number" defaultValue="2" required />
        <button type="submit">{loading ? "Predicting..." : "Predict Late Delivery"}</button>
      </form>
      {result && (
        <p>
          Prediction: <strong>{result.prediction === 1 ? "Likely Late" : "Likely On Time"}</strong> ({(result.probability * 100).toFixed(2)}%)
        </p>
      )}
    </div>
  );
}
