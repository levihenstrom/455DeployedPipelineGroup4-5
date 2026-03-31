import { spawn } from "node:child_process";
import { join } from "node:path";

function normalizeInput(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      out[key] = Number(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function runPrediction(task: "fraud" | "delivery", payload: Record<string, unknown>) {
  const pythonBin = process.env.PYTHON_BIN || "python3";
  const scriptPath = join(/* turbopackIgnore: true */ process.cwd(), "..", "ml", "src", "predict.py");
  const normalized = normalizeInput(payload);

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const proc = spawn(pythonBin, [scriptPath, "--task", task, "--json", JSON.stringify(normalized)]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Inference exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (err) {
        reject(err);
      }
    });
  });
}
