import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";
import { runPrediction } from "@/lib/inference";
import {
  buildFraudPayload,
  computeRiskScoreFeature,
  shipmentDefaultsFromCheckout,
  type CustomerRow,
} from "@/lib/fraudPayload";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = req.nextUrl.searchParams.get("detail") === "true";
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      if (detail) {
        const orders = db
          .prepare(
            `SELECT
               o.order_id, o.order_datetime, o.order_subtotal, o.shipping_fee, o.tax_amount, o.order_total,
               o.payment_method, o.is_fraud,
               s.shipping_method, s.carrier, s.late_delivery
             FROM orders o
             LEFT JOIN shipments s ON s.order_id = o.order_id
             WHERE o.customer_id = ?
             ORDER BY o.order_datetime DESC`
          )
          .all(Number(id)) as any[];

        const itemStmt = db.prepare(
          `SELECT
             oi.quantity, oi.unit_price, oi.line_total, p.product_name
           FROM order_items oi
           LEFT JOIN products p ON p.product_id = oi.product_id
           WHERE oi.order_id = ?`
        );

        const result = orders.map((o) => ({
          ...o,
          is_fraud: Boolean(o.is_fraud),
          late_delivery: o.late_delivery == null ? null : Boolean(o.late_delivery),
          items: (itemStmt.all(o.order_id) as any[]).map((i) => ({
            product_name: i.product_name ?? "Unknown",
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
            line_total: Number(i.line_total),
          })),
        }));

        return NextResponse.json(result);
      }

      const rows = db
        .prepare(
          `SELECT
             o.order_id, o.order_datetime, o.order_total, o.is_fraud, s.late_delivery
           FROM orders o
           LEFT JOIN shipments s ON s.order_id = o.order_id
           WHERE o.customer_id = ?
           ORDER BY o.order_datetime DESC`
        )
        .all(Number(id)) as any[];

      const result = rows.map((o) => ({
        ...o,
        is_fraud: Boolean(o.is_fraud),
        late_delivery: o.late_delivery == null ? null : Boolean(o.late_delivery),
      }));

      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  if (detail) {
    // Full order history with line items
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        order_id, order_datetime, order_subtotal, shipping_fee, tax_amount, order_total,
        payment_method, is_fraud,
        shipments(shipping_method, carrier, late_delivery),
        order_items(quantity, unit_price, line_total, products(product_name))
      `)
      .eq("customer_id", id)
      .order("order_datetime", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = (orders ?? []).map((o: any) => ({
      order_id: o.order_id,
      order_datetime: o.order_datetime,
      order_subtotal: o.order_subtotal,
      shipping_fee: o.shipping_fee,
      tax_amount: o.tax_amount,
      order_total: o.order_total,
      payment_method: o.payment_method,
      is_fraud: o.is_fraud,
      shipping_method: o.shipments?.shipping_method ?? null,
      carrier: o.shipments?.carrier ?? null,
      late_delivery: o.shipments?.late_delivery ?? null,
      items: (o.order_items ?? []).map((i: any) => ({
        product_name: i.products?.product_name ?? "Unknown",
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
    }));

    return NextResponse.json(result);
  }

  // Summary view for dashboard
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      order_id, order_datetime, order_total, is_fraud,
      shipments(late_delivery)
    `)
    .eq("customer_id", id)
    .order("order_datetime", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (orders ?? []).map((o: any) => ({
    order_id: o.order_id,
    order_datetime: o.order_datetime,
    order_total: o.order_total,
    is_fraud: o.is_fraud,
    late_delivery: o.shipments?.late_delivery ?? null,
  }));

  return NextResponse.json(result);
}

type CheckoutBody = {
  items: { product_id: number; quantity: number }[];
  shipping_state: string;
  payment_method: string;
  shipping_method: string;
  billing_zip?: string;
  shipping_zip?: string;
  promo_used?: boolean;
  promo_code?: string | null;
  device_type?: string;
  ip_country?: string;
};

async function runFraudForOrder(
  payload: Record<string, string | number>
): Promise<{ probability: number; prediction: number } | null> {
  try {
    const result = await runPrediction("fraud", payload);
    return {
      probability: Number(result.probability),
      prediction: Number(result.prediction),
    };
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as CheckoutBody;
  const {
    items,
    shipping_state,
    payment_method,
    shipping_method: shipMethodRaw,
    billing_zip: billingZipIn,
    shipping_zip: shippingZipIn,
    promo_used: promoUsedIn,
    promo_code: promoCodeIn,
    device_type: deviceTypeIn,
    ip_country: ipCountryIn,
  } = body;

  const shipMethod = shipMethodRaw || "standard";

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
  }
  if (!shipping_state || !payment_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      try {
        db.exec("ALTER TABLE orders ADD COLUMN fraud_probability REAL");
      } catch {
        /* exists */
      }

      const cust = db
        .prepare(
          `SELECT gender, state, customer_segment, loyalty_tier, birthdate, created_at, zip_code
           FROM customers WHERE customer_id = ?`
        )
        .get(Number(id)) as Record<string, string> | undefined;
      if (!cust) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const productIds = items.map((i) => Number(i.product_id));
      const placeholders = productIds.map(() => "?").join(",");
      const products = db
        .prepare(`SELECT product_id, price FROM products WHERE product_id IN (${placeholders})`)
        .all(...productIds) as { product_id: number; price: number }[];
      const priceMap = new Map(products.map((p) => [Number(p.product_id), Number(p.price)]));

      let subtotal = 0;
      const lineItems = items.map((i) => {
        const productId = Number(i.product_id);
        const quantity = Number(i.quantity);
        const price = priceMap.get(productId) ?? 0;
        const lineTotal = Math.round(price * quantity * 100) / 100;
        subtotal += lineTotal;
        return { product_id: productId, quantity, unit_price: price, line_total: lineTotal };
      });
      subtotal = Math.round(subtotal * 100) / 100;

      const shippingFee = shipMethod === "express" ? 15.99 : shipMethod === "overnight" ? 29.99 : 5.99;
      const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
      const orderTotal = Math.round((subtotal + shippingFee + taxAmount) * 100) / 100;
      const riskScore = computeRiskScoreFeature(subtotal, orderTotal);
      const billingZip = billingZipIn?.trim() || cust.zip_code || "00000";
      const shippingZip = shippingZipIn?.trim() || billingZip;
      const promoUsed = Boolean(promoUsedIn);
      const promoCode = promoUsed && promoCodeIn?.trim() ? promoCodeIn.trim() : null;
      const deviceType = deviceTypeIn?.trim() || "web";
      const ipCountry = ipCountryIn?.trim() || "US";
      const shipDef = shipmentDefaultsFromCheckout(shipMethod);
      const nowIso = new Date().toISOString();

      const orderId = db.transaction(() => {
        const orderInsert = db.prepare(
          `INSERT INTO orders (
             customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
             payment_method, device_type, ip_country, promo_used, promo_code,
             order_subtotal, shipping_fee, tax_amount, order_total, risk_score, is_fraud
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const orderResult = orderInsert.run(
          Number(id),
          nowIso.replace("T", " ").slice(0, 19),
          billingZip,
          shippingZip,
          String(shipping_state),
          String(payment_method),
          deviceType,
          ipCountry,
          promoUsed ? 1 : 0,
          promoCode,
          subtotal,
          shippingFee,
          taxAmount,
          orderTotal,
          riskScore,
          0
        );
        const oid = Number(orderResult.lastInsertRowid);

        const itemInsert = db.prepare(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?)`
        );
        for (const li of lineItems) {
          itemInsert.run(oid, li.product_id, li.quantity, li.unit_price, li.line_total);
        }

        const maxShip =
          (db.prepare("SELECT MAX(shipment_id) as m FROM shipments").get() as { m: number | null })?.m ?? 0;
        const shipmentId = maxShip + 1;
        db.prepare(
          `INSERT INTO shipments (shipment_id, order_id, ship_datetime, carrier, shipping_method, distance_band, promised_days, actual_days, late_delivery)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          shipmentId,
          oid,
          nowIso.replace("T", " ").slice(0, 19),
          shipDef.carrier,
          shipDef.shipping_method,
          shipDef.distance_band,
          shipDef.promised_days,
          shipDef.actual_days,
          0
        );

        return oid;
      })();

      const customerRow: CustomerRow = {
        gender: cust.gender,
        state: cust.state,
        customer_segment: cust.customer_segment,
        loyalty_tier: cust.loyalty_tier,
        birthdate: cust.birthdate,
        created_at: cust.created_at,
      };

      const fraudPayload = buildFraudPayload({
        order: {
          order_subtotal: subtotal,
          shipping_fee: shippingFee,
          tax_amount: taxAmount,
          order_total: orderTotal,
          risk_score: riskScore,
          payment_method: String(payment_method),
          device_type: deviceType,
          ip_country: ipCountry,
          promo_used: promoUsed,
          shipping_state: String(shipping_state),
        },
        customer: customerRow,
        shipment: shipDef,
        lineItems,
        orderDatetime: nowIso,
      });

      const fraud = await runFraudForOrder(fraudPayload);
      if (fraud) {
        db.prepare("UPDATE orders SET fraud_probability = ? WHERE order_id = ?").run(fraud.probability, orderId);
      }

      return NextResponse.json({
        order_id: orderId,
        order_total: orderTotal,
        fraud_probability: fraud?.probability ?? null,
        fraud_prediction: fraud?.prediction ?? null,
      });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("gender, state, customer_segment, loyalty_tier, birthdate, created_at, zip_code")
    .eq("customer_id", id)
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("product_id, price")
    .in("product_id", productIds);

  if (prodErr || !products) {
    return NextResponse.json({ error: "Failed to look up products" }, { status: 500 });
  }

  const priceMap = new Map(products.map((p: { product_id: number; price: number }) => [p.product_id, Number(p.price)]));

  let subtotal = 0;
  const lineItems = items.map((i) => {
    const price = priceMap.get(i.product_id) ?? 0;
    const lineTotal = price * i.quantity;
    subtotal += lineTotal;
    return { product_id: i.product_id, quantity: i.quantity, unit_price: price, line_total: lineTotal };
  });

  const shippingFee = shipMethod === "express" ? 15.99 : shipMethod === "overnight" ? 29.99 : 5.99;
  const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
  const orderTotal = Math.round((subtotal + shippingFee + taxAmount) * 100) / 100;
  const riskScore = computeRiskScoreFeature(subtotal, orderTotal);
  const billingZip = billingZipIn?.trim() || (customer as { zip_code?: string }).zip_code || "00000";
  const shippingZip = shippingZipIn?.trim() || billingZip;
  const promoUsed = Boolean(promoUsedIn);
  const promoCode = promoUsed && promoCodeIn?.trim() ? promoCodeIn.trim() : null;
  const deviceType = deviceTypeIn?.trim() || "web";
  const ipCountry = ipCountryIn?.trim() || "US";
  const shipDef = shipmentDefaultsFromCheckout(shipMethod);
  const orderDatetimeIso = new Date().toISOString();

  const { data: maxRow } = await supabase
    .from("orders")
    .select("order_id")
    .order("order_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrderId = (maxRow?.order_id ?? 0) + 1;

  const { error: orderErr } = await supabase.from("orders").insert({
    order_id: newOrderId,
    customer_id: Number(id),
    order_datetime: orderDatetimeIso,
    billing_zip: billingZip,
    shipping_zip: shippingZip,
    shipping_state,
    payment_method,
    device_type: deviceType,
    ip_country: ipCountry,
    promo_used: promoUsed,
    promo_code: promoCode,
    order_subtotal: subtotal,
    shipping_fee: shippingFee,
    tax_amount: taxAmount,
    order_total: orderTotal,
    risk_score: riskScore,
    is_fraud: false,
  });

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  const { data: maxShipRow } = await supabase
    .from("shipments")
    .select("shipment_id")
    .order("shipment_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newShipmentId = (maxShipRow?.shipment_id ?? 0) + 1;

  const { error: shipErr } = await supabase.from("shipments").insert({
    shipment_id: newShipmentId,
    order_id: newOrderId,
    ship_datetime: orderDatetimeIso,
    carrier: shipDef.carrier,
    shipping_method: shipDef.shipping_method,
    distance_band: shipDef.distance_band,
    promised_days: shipDef.promised_days,
    actual_days: shipDef.actual_days,
    late_delivery: false,
  });

  if (shipErr) {
    return NextResponse.json({ error: shipErr.message }, { status: 500 });
  }

  const { data: maxItemRow } = await supabase
    .from("order_items")
    .select("order_item_id")
    .order("order_item_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextItemId = (maxItemRow?.order_item_id ?? 0) + 1;

  const orderItemsToInsert = lineItems.map((li) => ({
    order_item_id: nextItemId++,
    order_id: newOrderId,
    product_id: li.product_id,
    quantity: li.quantity,
    unit_price: li.unit_price,
    line_total: li.line_total,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItemsToInsert);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  const c = customer as {
    gender: string;
    state: string | null;
    customer_segment: string | null;
    loyalty_tier: string | null;
    birthdate: string;
    created_at: string;
  };

  const customerRow: CustomerRow = {
    gender: c.gender,
    state: c.state,
    customer_segment: c.customer_segment,
    loyalty_tier: c.loyalty_tier,
    birthdate: c.birthdate,
    created_at: c.created_at,
  };

  const fraudPayload = buildFraudPayload({
    order: {
      order_subtotal: subtotal,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      order_total: orderTotal,
      risk_score: riskScore,
      payment_method: String(payment_method),
      device_type: deviceType,
      ip_country: ipCountry,
      promo_used: promoUsed,
      shipping_state: String(shipping_state),
    },
    customer: customerRow,
    shipment: shipDef,
    lineItems,
    orderDatetime: orderDatetimeIso,
  });

  const fraud = await runFraudForOrder(fraudPayload);

  if (fraud) {
    const { error: updErr } = await supabase
      .from("orders")
      .update({ fraud_probability: fraud.probability })
      .eq("order_id", newOrderId);
    if (updErr) {
      /* column may not exist until migration */
    }
  }

  return NextResponse.json({
    order_id: newOrderId,
    order_total: orderTotal,
    fraud_probability: fraud?.probability ?? null,
    fraud_prediction: fraud?.prediction ?? null,
  });
}
