import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase";

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server client not configured" },
      { status: 500 }
    );
  }

  try {
    const payload = await req.json();
    
    // Accept either a single record or an array of records
    const records = Array.isArray(payload) ? payload : [payload];

    if (records.length === 0) {
      return NextResponse.json({ message: "No records provided" });
    }

    // Insert records into the order_predictions table
    // (Named 'upsert' to follow the PLAN, but functions as insert for appending new prediction logs)
    const { data, error } = await supabase
      .from("order_predictions")
      .insert(records.map(record => ({
        // Ensure mapping to DB schema
        order_id: record.order_id,
        task_name: record.task_name,
        probability: record.probability,
        predicted_class: record.predicted_class,
        model_threshold: record.model_threshold,
        features_json: record.features_json || null,
        // prediction_timestamp is default now()
      })));

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, count: records.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
