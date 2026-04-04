import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      const rows = db
        .prepare(
          `SELECT
             o.order_id,
             c.full_name AS customer_name,
             o.order_total,
             o.order_datetime,
             o.shipping_state,
             s.shipping_method,
             s.carrier,
             p.late_delivery_probability AS late_probability
           FROM orders o
           JOIN customers c ON c.customer_id = o.customer_id
           JOIN order_predictions p ON p.order_id = o.order_id
           LEFT JOIN shipments s ON s.order_id = o.order_id
           ORDER BY p.late_delivery_probability DESC, o.order_datetime ASC
           LIMIT 50`
        )
        .all();
      return NextResponse.json(rows);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("no such table: order_predictions")) {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  // Preferred table name from Chapter 17.
  const { data: predRows, error: predErr } = await supabase
    .from("order_predictions")
    .select(`
      order_id, late_delivery_probability,
      orders(order_total, order_datetime, shipping_state,
        customers(full_name),
        shipments(shipping_method, carrier)
      )
    `)
    .order("late_delivery_probability", { ascending: false })
    .limit(50);

  if (!predErr && predRows) {
    const result = predRows.map((row: any) => ({
      order_id: row.order_id,
      customer_name: row.orders?.customers?.full_name ?? "Unknown",
      order_total: row.orders?.order_total ?? 0,
      order_datetime: row.orders?.order_datetime ?? "",
      shipping_state: row.orders?.shipping_state ?? "",
      shipping_method: row.orders?.shipments?.shipping_method ?? null,
      carrier: row.orders?.shipments?.carrier ?? null,
      late_probability: row.late_delivery_probability,
    }));
    return NextResponse.json(result);
  }

  // Backward compatible table used in some earlier iterations.
  const { data, error } = await supabase
    .from("prediction_scores")
    .select(`
      order_id, late_probability,
      orders(order_total, order_datetime, shipping_state,
        customers(full_name),
        shipments(shipping_method, carrier)
      )
    `)
    .order("late_probability", { ascending: false })
    .limit(50);

  if (!error && data) {
    const result = data.map((row: any) => ({
      order_id: row.order_id,
      customer_name: row.orders?.customers?.full_name ?? "Unknown",
      order_total: row.orders?.order_total ?? 0,
      order_datetime: row.orders?.order_datetime ?? "",
      shipping_state: row.orders?.shipping_state ?? "",
      shipping_method: row.orders?.shipments?.shipping_method ?? null,
      carrier: row.orders?.shipments?.carrier ?? null,
      late_probability: row.late_probability,
    }));
    return NextResponse.json(result);
  }

  // No model scores available (avoid misleading fallback that used actual_days / late label).
  return NextResponse.json([]);
}
