import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      const body = await req.json();
      const { items, shipping_state, payment_method, shipping_method } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
      }
      if (!shipping_state || !payment_method) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const productIds = items.map((i: any) => Number(i.product_id));
      const placeholders = productIds.map(() => "?").join(",");
      const products = db
        .prepare(
          `SELECT product_id, price
           FROM products
           WHERE product_id IN (${placeholders})`
        )
        .all(...productIds) as any[];
      const priceMap = new Map(products.map((p) => [Number(p.product_id), Number(p.price)]));

      let subtotal = 0;
      const lineItems = items.map((i: any) => {
        const productId = Number(i.product_id);
        const quantity = Number(i.quantity);
        const price = priceMap.get(productId) ?? 0;
        const lineTotal = Math.round(price * quantity * 100) / 100;
        subtotal += lineTotal;
        return { product_id: productId, quantity, unit_price: price, line_total: lineTotal };
      });
      subtotal = Math.round(subtotal * 100) / 100;

      const shippingFee = shipping_method === "express" ? 15.99 : shipping_method === "overnight" ? 29.99 : 5.99;
      const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
      const orderTotal = Math.round((subtotal + shippingFee + taxAmount) * 100) / 100;
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      const transaction = db.transaction(() => {
        const orderInsert = db.prepare(
          `INSERT INTO orders (
             customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
             payment_method, device_type, ip_country, promo_used, promo_code,
             order_subtotal, shipping_fee, tax_amount, order_total, risk_score, is_fraud
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const orderResult = orderInsert.run(
          Number(id),
          now,
          "",
          "",
          String(shipping_state),
          String(payment_method),
          "web",
          "US",
          0,
          null,
          subtotal,
          shippingFee,
          taxAmount,
          orderTotal,
          0,
          0
        );
        const orderId = Number(orderResult.lastInsertRowid);

        const itemInsert = db.prepare(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?)`
        );
        for (const li of lineItems) {
          itemInsert.run(orderId, li.product_id, li.quantity, li.unit_price, li.line_total);
        }
        return orderId;
      });

      const orderId = transaction();
      return NextResponse.json({ order_id: orderId, order_total: orderTotal });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const body = await req.json();
  const { items, shipping_state, payment_method, shipping_method } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
  }
  if (!shipping_state || !payment_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Look up product prices
  const productIds = items.map((i: any) => i.product_id);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("product_id, price")
    .in("product_id", productIds);

  if (prodErr || !products) {
    return NextResponse.json({ error: "Failed to look up products" }, { status: 500 });
  }

  const priceMap = new Map(products.map((p: any) => [p.product_id, Number(p.price)]));

  // Calculate totals
  let subtotal = 0;
  const lineItems = items.map((i: any) => {
    const price = priceMap.get(i.product_id) ?? 0;
    const lineTotal = price * i.quantity;
    subtotal += lineTotal;
    return { product_id: i.product_id, quantity: i.quantity, unit_price: price, line_total: lineTotal };
  });

  const shippingFee = shipping_method === "express" ? 15.99 : shipping_method === "overnight" ? 29.99 : 5.99;
  const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
  const orderTotal = Math.round((subtotal + shippingFee + taxAmount) * 100) / 100;

  // Generate a new order_id (max + 1)
  const { data: maxRow } = await supabase
    .from("orders")
    .select("order_id")
    .order("order_id", { ascending: false })
    .limit(1)
    .single();

  const newOrderId = (maxRow?.order_id ?? 0) + 1;

  // Insert order
  const { error: orderErr } = await supabase.from("orders").insert({
    order_id: newOrderId,
    customer_id: Number(id),
    order_datetime: new Date().toISOString(),
    shipping_state,
    payment_method,
    device_type: "web",
    ip_country: "US",
    order_subtotal: subtotal,
    shipping_fee: shippingFee,
    tax_amount: taxAmount,
    order_total: orderTotal,
    risk_score: 0,
    is_fraud: false,
  });

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  // Generate order_item_ids
  const { data: maxItemRow } = await supabase
    .from("order_items")
    .select("order_item_id")
    .order("order_item_id", { ascending: false })
    .limit(1)
    .single();

  let nextItemId = (maxItemRow?.order_item_id ?? 0) + 1;

  const orderItemsToInsert = lineItems.map((li: any) => ({
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

  return NextResponse.json({ order_id: newOrderId, order_total: orderTotal });
}
