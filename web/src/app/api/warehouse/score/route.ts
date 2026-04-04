import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { join } from "node:path";

/**
 * Batch-write late-delivery probabilities using the trained sklearn model
 * (features without outcome leakage — see ml/src/extract_and_clean.py).
 * Requires Python + ml/models on the host and DATABASE_URL or local shop.db.
 */
export async function POST() {
  const pythonBin = process.env.PYTHON_BIN || "python3";
  const scriptPath = join(process.cwd(), "..", "ml", "src", "score_late_delivery_predictions.py");

  const runScorer = () =>
    new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
      const proc = spawn(pythonBin, [scriptPath], {
        env: { ...process.env },
        cwd: join(process.cwd(), ".."),
      });
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => proc.kill("SIGTERM"), 120_000);
      proc.stdout.on("data", (c) => {
        stdout += c.toString();
      });
      proc.stderr.on("data", (c) => {
        stderr += c.toString();
      });
      proc.on("close", (code) => {
        clearTimeout(timeout);
        resolve({ code, stdout, stderr });
      });
      proc.on("error", () => {
        clearTimeout(timeout);
        resolve({ code: -1, stdout, stderr });
      });
    });

  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "Late-delivery batch scoring is not available on Vercel (no Python runtime). " +
          "Run python ml/src/score_late_delivery_predictions.py with DATABASE_URL, or add it to GitHub Actions.",
        scored: 0,
      },
      { status: 503 },
    );
  }

  const { code, stdout, stderr } = await runScorer();
  if (code !== 0) {
    return NextResponse.json(
      {
        error: stderr || stdout || `Scoring exited with code ${code}`,
        scored: 0,
      },
      { status: 500 },
    );
  }

  const match = stdout.match(/Predictions written:\s*(\d+)/i) ?? stdout.match(/Scored (\d+) orders/i);
  const scored = match ? Number(match[1]) : null;

  return NextResponse.json({
    scored,
    message: "Late-delivery scoring complete (model-based, no shipment-outcome heuristic).",
    timestamp: new Date().toISOString(),
    stdout: stdout.trim(),
  });
}
