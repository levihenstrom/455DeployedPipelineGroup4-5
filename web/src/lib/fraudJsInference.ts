import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type FraudInferenceBundle = {
  version: number;
  threshold: number;
  feature_columns: string[];
  numeric: Array<{ name: string; median: number; mean: number; scale: number }>;
  categorical: Array<{ name: string; fill: string; categories: string[] }>;
  coef: number[];
  intercept: number;
};

let bundleCache: FraudInferenceBundle | null | undefined;

function bundlePath(): string {
  return join(process.cwd(), "ml-runtime", "fraud_inference_bundle.json");
}

export function fraudJsBundlePath(): string {
  return bundlePath();
}

export function fraudJsBundleExists(): boolean {
  try {
    return existsSync(bundlePath());
  } catch {
    return false;
  }
}

function loadBundle(): FraudInferenceBundle | null {
  if (bundleCache !== undefined) {
    return bundleCache;
  }
  const p = bundlePath();
  if (!existsSync(p)) {
    bundleCache = null;
    return null;
  }
  bundleCache = JSON.parse(readFileSync(p, "utf-8")) as FraudInferenceBundle;
  return bundleCache;
}

/** Same derived fields as ml/src/predict.py _enrich_fraud_payload. */
export function enrichFraudPayload(data: Record<string, unknown>): Record<string, unknown> {
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
  if (out.actual_days == null || out.actual_days === "") {
    const pd = Number(out.promised_days);
    out.actual_days = Number.isFinite(pd) ? pd : 0;
  }
  return out;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function denseVector(bundle: FraudInferenceBundle, row: Record<string, unknown>): number[] {
  const numVals: number[] = [];
  for (const spec of bundle.numeric) {
    const raw = row[spec.name];
    let v: number;
    if (raw === undefined || raw === "") {
      v = spec.median;
    } else {
      const n = typeof raw === "number" ? raw : Number(raw);
      v = Number.isFinite(n) ? n : spec.median;
    }
    if (!Number.isFinite(v)) {
      v = spec.median;
    }
    numVals.push((v - spec.mean) / spec.scale);
  }

  const catVals: number[] = [];
  for (const spec of bundle.categorical) {
    const raw = row[spec.name];
    const s =
      raw === undefined || raw === null || raw === "" ? spec.fill : String(raw);
    const cats = spec.categories;
    const width = cats.length;
    if (!cats.includes(s)) {
      for (let j = 0; j < width; j++) {
        catVals.push(0);
      }
    } else {
      const idx = cats.indexOf(s);
      for (let j = 0; j < width; j++) {
        catVals.push(j === idx ? 1 : 0);
      }
    }
  }

  return numVals.concat(catVals);
}

/** Matches sklearn fraud pipeline output (tested vs export_fraud_js_bundle.py). */
export function runFraudJsPrediction(payload: Record<string, unknown>): Record<string, unknown> {
  const bundle = loadBundle();
  if (!bundle || bundle.version !== 1) {
    throw new Error("fraud_inference_bundle.json missing or unsupported version");
  }
  const row = enrichFraudPayload(payload);
  const x = denseVector(bundle, row);
  if (x.length !== bundle.coef.length) {
    throw new Error(`Feature dimension mismatch: got ${x.length}, expected ${bundle.coef.length}`);
  }
  let z = bundle.intercept;
  for (let i = 0; i < x.length; i++) {
    z += bundle.coef[i] * x[i];
  }
  const probability = sigmoid(z);
  const prediction = probability >= bundle.threshold ? 1 : 0;
  return {
    task: "fraud",
    prediction,
    probability,
  };
}
