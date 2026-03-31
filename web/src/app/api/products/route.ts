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
          `SELECT product_id, product_name, price, category
           FROM products
           WHERE is_active = 1
           ORDER BY product_name`
        )
        .all();
      return NextResponse.json(rows);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select("product_id, product_name, price, category")
    .eq("is_active", true)
    .order("product_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
