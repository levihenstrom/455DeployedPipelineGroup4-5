import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSqliteDb } from "@/lib/sqlite";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    try {
      const db = getSqliteDb();
      const row = db
        .prepare(
          `SELECT customer_id, full_name, email, gender, customer_segment, loyalty_tier, city, state
           FROM customers
           WHERE customer_id = ?`
        )
        .get(Number(id));
      if (!row) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      return NextResponse.json(row);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .select("customer_id, full_name, email, gender, customer_segment, loyalty_tier, city, state")
    .eq("customer_id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}
