/**
 * Builds the JSON payload expected by ml/src/predict.py for task=fraud
 * (same feature order/names as ml/src/extract_and_clean.py build_fraud_dataset).
 */

export type CustomerRow = {
  gender: string;
  state: string | null;
  customer_segment: string | null;
  loyalty_tier: string | null;
  birthdate: string;
  created_at: string;
};

export type ShipmentDefaults = {
  shipping_method: string;
  distance_band: string;
  promised_days: number;
  actual_days: number;
  carrier: string;
};

export function shipmentDefaultsFromCheckout(shippingMethod: string): ShipmentDefaults {
  switch (shippingMethod) {
    case "express":
      return {
        shipping_method: "express",
        distance_band: "regional",
        promised_days: 3,
        actual_days: 3,
        carrier: "FedEx",
      };
    case "overnight":
      return {
        shipping_method: "overnight",
        distance_band: "national",
        promised_days: 1,
        actual_days: 1,
        carrier: "UPS",
      };
    default:
      return {
        shipping_method: "standard",
        distance_band: "regional",
        promised_days: 5,
        actual_days: 5,
        carrier: "USPS",
      };
  }
}

function clip(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function computeRiskScoreFeature(orderSubtotal: number, orderTotal: number): number {
  const base = orderTotal > 0 ? (orderSubtotal / orderTotal) * 60 + orderTotal * 0.02 : 5;
  return Math.round(clip(base, 1, 99) * 10) / 10;
}

export function buildFraudPayload(input: {
  order: {
    order_subtotal: number;
    shipping_fee: number;
    tax_amount: number;
    order_total: number;
    risk_score: number;
    payment_method: string;
    device_type: string;
    ip_country: string;
    promo_used: boolean;
    shipping_state: string;
  };
  customer: CustomerRow;
  shipment: ShipmentDefaults;
  lineItems: { quantity: number; unit_price: number; product_id: number }[];
  orderDatetime: string;
}): Record<string, number | string> {
  const { order, customer, shipment, lineItems, orderDatetime } = input;

  const totalQty = lineItems.reduce((s, i) => s + i.quantity, 0);
  const uniqueProducts = new Set(lineItems.map((i) => i.product_id)).size;
  const avgItemPrice =
    lineItems.length > 0
      ? lineItems.reduce((s, i) => s + i.unit_price * i.quantity, 0) / Math.max(1, totalQty)
      : 0;

  const orderDate = new Date(orderDatetime);
  const birth = new Date(customer.birthdate);
  const created = new Date(customer.created_at);
  const customerAge = clip((orderDate.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 14, 100);
  const accountAgeDays = Math.max(
    0,
    Math.floor((orderDate.getTime() - created.getTime()) / (24 * 60 * 60 * 1000))
  );

  const sub = order.order_subtotal;
  const shipToSub = sub > 0 ? order.shipping_fee / sub : 0;
  const taxToSub = sub > 0 ? order.tax_amount / sub : 0;

  return {
    order_total: order.order_total,
    order_subtotal: order.order_subtotal,
    shipping_fee: order.shipping_fee,
    tax_amount: order.tax_amount,
    risk_score: order.risk_score,
    payment_method: order.payment_method,
    device_type: order.device_type,
    ip_country: order.ip_country,
    promo_used: order.promo_used ? 1 : 0,
    customer_segment: customer.customer_segment ?? "standard",
    loyalty_tier: customer.loyalty_tier ?? "silver",
    gender: customer.gender,
    state: customer.state ?? "UNKNOWN",
    shipping_state: order.shipping_state,
    shipping_method: shipment.shipping_method,
    distance_band: shipment.distance_band,
    promised_days: shipment.promised_days,
    actual_days: shipment.actual_days,
    items_per_order: totalQty,
    unique_products: uniqueProducts,
    avg_item_price: Math.round(avgItemPrice * 100) / 100,
    customer_age: Math.round(customerAge * 10) / 10,
    account_age_days: accountAgeDays,
    shipping_to_subtotal_ratio: Math.round(shipToSub * 10000) / 10000,
    tax_to_subtotal_ratio: Math.round(taxToSub * 10000) / 10000,
  };
}
