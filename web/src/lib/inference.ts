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

function inferenceBaseUrl(): string {
  return (process.env.ML_INFERENCE_URL || "").trim().replace(/\/$/, "");
}

function canUseLocalPython(): boolean {
  if (process.env.VERCEL !== "1") return true;
  return Boolean((process.env.PYTHON_BIN || "").trim());
}

async function runPredictionRemote(
  task: "fraud" | "delivery",
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const base = inferenceBaseUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = (process.env.ML_INFERENCE_API_KEY || "").trim();
  if (key) {
    headers["x-api-key"] = key;
  }
  const res = await fetch(`${base}/predict`, {
    method: "POST",
    headers,
    body: JSON.stringify({ task, payload }),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || res.statusText || "Invalid JSON from inference service");
  }
  if (!res.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail: unknown }).detail
        : data;
    const msg = Array.isArray(detail)
      ? detail.map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : String(d))).join("; ")
      : String(detail ?? res.statusText);
    throw new Error(msg || `Inference HTTP ${res.status}`);
  }
  return data as Record<string, unknown>;
}

export function runPrediction(task: "fraud" | "delivery", payload: Record<string, unknown>) {
  const normalized = normalizeInput(payload);
  const remote = inferenceBaseUrl();

  if (remote) {
    return runPredictionRemote(task, normalized);
  }

  if (!canUseLocalPython()) {
    return Promise.reject(
      new Error(
        "Python inference is not available on this deployment. Set ML_INFERENCE_URL to your hosted inference service (see ml/src/inference_server.py), or run the app locally with Python and ml/models. Order history shows batch-scored fraud probabilities from the nightly job.",
      ),
    );
  }

  const pythonBin = process.env.PYTHON_BIN || "python3";
  const scriptPath = join(/* turbopackIgnore: true */ process.cwd(), "..", "ml", "src", "predict.py");

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
