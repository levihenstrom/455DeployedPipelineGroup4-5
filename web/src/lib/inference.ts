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

/** Match fraud_inference_config.json derived columns when the form omits them. */
function enrichFraudPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  const sub = Number(out.order_subtotal);
  const ship = Number(out.shipping_fee);
  const tax = Number(out.tax_amount);
  if (Number.isFinite(sub) && sub > 0) {
    out.shipping_to_subtotal_ratio = Number.isFinite(ship) ? ship / sub : 0;
    out.tax_to_subtotal_ratio = Number.isFinite(tax) ? tax / sub : 0;
  } else {
    out.shipping_to_subtotal_ratio = 0;
    out.tax_to_subtotal_ratio = 0;
  }
  const actualEmpty = out.actual_days == null || out.actual_days === "";
  if (actualEmpty) {
    const pd = Number(out.promised_days);
    out.actual_days = Number.isFinite(pd) ? pd : 0;
  }
  return out;
}

export function runPrediction(task: "fraud" | "delivery", payload: Record<string, unknown>) {
  const pythonBin = process.env.PYTHON_BIN || "python3";
  if (process.env.VERCEL === "1" && !(process.env.PYTHON_BIN || "").trim()) {
    return Promise.reject(
      new Error(
        "Python + scikit-learn inference is not available on Vercel. Use Order history for batch-scored fraud probabilities, or run the app locally from the repo with Python and ml/models artifacts.",
      ),
    );
  }
  const scriptPath = join(/* turbopackIgnore: true */ process.cwd(), "..", "ml", "src", "predict.py");
  let normalized = normalizeInput(payload);
  if (task === "fraud") {
    normalized = enrichFraudPayload(normalized);
  }

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
