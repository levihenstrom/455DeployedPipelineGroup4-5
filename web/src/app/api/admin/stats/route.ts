import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

/** Orders per day for charts + KPI strip (last 30 days). */
export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      try {
        db.exec("ALTER TABLE orders ALTER COLUMN is_fraud DROP NOT NULL");
      } catch {
        /* noop */
      }

      const dtRows = db.prepare(`SELECT order_datetime FROM orders`).all() as { order_datetime: string }[];
      const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const byDay = new Map<string, number>();
      for (const r of dtRows) {
        const t = new Date(r.order_datetime).getTime();
        if (Number.isNaN(t) || t < sinceMs) continue;
        const key = new Date(r.order_datetime).toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      }
      const ordersByDay = [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      const pendingRow = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE is_fraud IS NULL`).get() as { c: number };
      const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM orders`).get() as { c: number };

      return NextResponse.json({
        ordersByDay,
        pendingReviewCount: Number(pendingRow?.c ?? 0),
        totalOrders: Number(totalRow?.c ?? 0),
      });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("order_datetime")
    .gte("order_datetime", since.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byDay = new Map<string, number>();
  for (const o of orders ?? []) {
    const d = new Date((o as { order_datetime: string }).order_datetime);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const ordersByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .is("is_fraud", null);

  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true });

  return NextResponse.json({
    ordersByDay,
    pendingReviewCount: pendingCount ?? 0,
    totalOrders: totalOrders ?? 0,
  });
}
