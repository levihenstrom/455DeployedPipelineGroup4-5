import { NextRequest, NextResponse } from "next/server";
import { runPrediction } from "@/lib/inference";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const result = await runPrediction("fraud", payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
