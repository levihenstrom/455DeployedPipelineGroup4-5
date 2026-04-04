import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `You are a fraud detection model. Based on these order features, return ONLY a JSON object with "prediction" (0 or 1) and "probability" (0.0 to 1.0). No explanation, just JSON.

Features: ${JSON.stringify(payload)}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
