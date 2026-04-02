import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server client not configured" },
      { status: 500 }
    );
  }

  // We want to fetch orders that have no matching row in order_predictions.
  // We'll do a simple fetch of the latest orders and check for any that lack prediction records.
  // Using PostgREST syntax for left join: order_predictions(prediction_id)
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_predictions(prediction_id)")
    .order("order_datetime", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out any orders that already have a prediction associated with them
  const unscored = data.filter(
    (order: Record<string, unknown> & { order_predictions?: any[] }) => !order.order_predictions || order.order_predictions.length === 0
  );

  // Clean up the output to not include the joined array
  const formattedUnscored = unscored.map((order: Record<string, unknown> & { order_predictions?: any[] }) => {
    const { order_predictions, ...rest } = order;
    return rest;
  });

  return NextResponse.json({ count: formattedUnscored.length, data: formattedUnscored });
}
