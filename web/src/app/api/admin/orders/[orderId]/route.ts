import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  if (typeof body.is_fraud !== "boolean") {
    return NextResponse.json({ error: "is_fraud boolean required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      const r = db.prepare("UPDATE orders SET is_fraud = ? WHERE order_id = ?").run(body.is_fraud ? 1 : 0, Number(orderId));
      if (r.changes === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, order_id: Number(orderId), is_fraud: body.is_fraud });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ is_fraud: body.is_fraud })
    .eq("order_id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order_id: orderId, is_fraud: body.is_fraud });
}
