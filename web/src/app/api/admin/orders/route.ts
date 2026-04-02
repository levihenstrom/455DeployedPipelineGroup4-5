import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

const LIMIT_ALL = 500;
const LIMIT_PENDING = 100;

function mapIsFraud(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  return Boolean(v);
}

export async function GET(req: NextRequest) {
  const queue = req.nextUrl.searchParams.get("queue") ?? "pending";
  const pendingOnly = queue !== "all";

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      try {
        db.exec("ALTER TABLE orders ADD COLUMN fraud_probability REAL");
      } catch {
        /* exists */
      }
      try {
        db.exec("ALTER TABLE orders ALTER COLUMN is_fraud DROP NOT NULL");
      } catch {
        /* exists */
      }

      const where = pendingOnly ? "WHERE o.is_fraud IS NULL" : "";
      const lim = pendingOnly ? LIMIT_PENDING : LIMIT_ALL;

      const rows = db
        .prepare(
          `SELECT
             o.order_id,
             o.order_datetime,
             o.order_total,
             o.is_fraud,
             o.fraud_probability,
             o.risk_score,
             c.full_name AS customer_name
           FROM orders o
           JOIN customers c ON c.customer_id = o.customer_id
           ${where}
           ORDER BY o.order_datetime DESC
           LIMIT ?`
        )
        .all(lim) as Record<string, unknown>[];

      return NextResponse.json(
        rows.map((r) => ({
          order_id: r.order_id,
          order_datetime: r.order_datetime,
          order_total: Number(r.order_total),
          is_fraud: mapIsFraud(r.is_fraud),
          fraud_probability:
            r.fraud_probability != null && r.fraud_probability !== ""
              ? Number(r.fraud_probability)
              : null,
          risk_score: Number(r.risk_score ?? 0),
          customer_name: String(r.customer_name ?? ""),
        }))
      );
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const base = supabase
    .from("orders")
    .select("order_id, order_datetime, order_total, is_fraud, fraud_probability, risk_score, customer_id")
    .order("order_datetime", { ascending: false });

  const { data: orderRows, error } = pendingOnly
    ? await base.is("is_fraud", null).limit(LIMIT_PENDING)
    : await base.limit(LIMIT_ALL);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = [...new Set((orderRows ?? []).map((o: { customer_id: number }) => o.customer_id))];
  const { data: custRows } =
    ids.length === 0
      ? { data: [] }
      : await supabase.from("customers").select("customer_id, full_name").in("customer_id", ids);

  const nameById = new Map(
    (custRows ?? []).map((c: { customer_id: number; full_name: string }) => [c.customer_id, c.full_name])
  );

  const mapped = (orderRows ?? []).map((o: Record<string, unknown>) => ({
    order_id: o.order_id,
    order_datetime: o.order_datetime,
    order_total: Number(o.order_total),
    is_fraud: o.is_fraud === null || o.is_fraud === undefined ? null : Boolean(o.is_fraud),
    fraud_probability: o.fraud_probability != null ? Number(o.fraud_probability) : null,
    risk_score: Number(o.risk_score ?? 0),
    customer_name: nameById.get(Number(o.customer_id)) ?? "",
  }));

  return NextResponse.json(mapped);
}
