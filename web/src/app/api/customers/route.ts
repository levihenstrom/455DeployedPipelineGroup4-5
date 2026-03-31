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
          `SELECT customer_id, full_name, email, customer_segment, loyalty_tier
           FROM customers
           WHERE is_active = 1
           ORDER BY full_name`
        )
        .all();
      return NextResponse.json(rows);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .select("customer_id, full_name, email, customer_segment, loyalty_tier")
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
